# Documentação dos nodes e scripts

Uma entrada por script/node: responsabilidade, entradas, saídas, de onde é chamado. Complementa os
comentários mínimos no próprio código (só "porquê" não óbvio, conforme
[`docs/style-guide.md`](./style-guide.md)) sem duplicar o que o nome das funções já deixa claro. Cresce
junto com `nodes/`/`apps-script/` conforme forem melhorados. Ver [`docs/architecture.md`](./architecture.md)
pro fluxo completo entre essas peças.

## `apps-script/normalizacao.gs`

**O que faz**: bound ao Google Form ("SecOps - Softwares Homologados"), disparado por um trigger
instalável de `onFormSubmit`. Lê cada resposta pelo ID interno da pergunta (`item.getId()`, estável
mesmo se o texto for reescrito) via `QUESTION_ID_MAP`, e grava uma linha já normalizada na aba
`Normalizado` da mesma planilha.

**Entrada**: o evento `onFormSubmit` do Google Forms (`e.response`).

**Saída**: uma linha na aba `Normalizado`, com as colunas em `OUTPUT_COLUMNS` - timestamp, e-mail do
respondente, `mapping_status` (`OK` ou `ATENÇÃO: <detalhe>`), cada campo mapeado em `QUESTION_ID_MAP`,
`full_answers_json` (todas as respostas agrupadas por seção, usadas na seção "Respostas Completas" do
parecer) e `parecer_doc_url` (vazio até o n8n escrever de volta).

**Chamado por**: o próprio Google Forms, não pelo n8n. O n8n só lê o resultado (via `Google Sheets
Trigger`, ver abaixo).

**Mecanismo de detecção de desvio** (`checkMappingDrift_`): compara os IDs em `QUESTION_ID_MAP` contra
os IDs reais das perguntas do formulário nesse exato momento. Uma pergunta mapeada que sumiu, ou uma
pergunta nova sem mapeamento, vira `ATENÇÃO: ...` na própria linha - visível na primeira submissão
depois da mudança, em vez de silencioso. Ver [`docs/DEVELOPMENT.md`](./DEVELOPMENT.md#manutenção-do-formulário-runbook)
pro runbook de manutenção.

## `nodes/risk/risk-score-generator.js` (Code node "Gerador de Score")

**O que faz**: calcula Probabilidade, Impacto e o score final (0-5, maior = mais seguro) a partir dos
campos normalizados. Cada critério (`RISK_CRITERIA`) tem peso e dimensão (`PROBABILITY` ou `IMPACT`):

| Critério | Peso | Dimensão |
|---|---|---|
| Criticidade do software | 2.0 | IMPACT |
| MFA ausente | 2.0 | PROBABILITY |
| Exposição à internet | 1.5 | PROBABILITY |
| Dados pessoais | 1.5 | IMPACT |
| SSO ausente | 1.0 | PROBABILITY |
| RBAC ausente | 1.0 | IMPACT |
| Auditoria ausente | 1.0 | IMPACT |

Risco por critério numa escala uniforme 0 (seguro) a 5 (risco máximo). Média ponderada calculada por
dimensão e no total, depois invertida (`5 - risco`) pra um score de segurança. Faixas de classificação
reaproveitadas do `risk-engine.service.ts` do [`morpheus-beta`](https://github.com/domcabral9/morpheus-beta)
(mesma escala 0-5): `probability_level`/`impact_level` em 1.66/3.33, `recommendation` em 3.0/4.0.

**Isenção pra software standalone**: quando `infra_hosting` é `"Standalone (instalação local, sem
login)"`, os critérios MFA/SSO/RBAC/Auditoria ficam `applicable: false` (excluídos do cálculo, nem
somam como risco nem como seguro) **se e somente se** a resposta não for "Sim" - um software autônomo
que genuinamente tem um desses controles (ex.: um gerenciador de senhas local com MFA próprio) continua
recebendo o crédito normalmente. `weightedAverageRisk` filtra por `applicable !== false` antes de somar
peso/risco, tanto por dimensão quanto no total.

**Entrada**: o item vindo de "Normalização" (via "Condição Crítica" → "App Crítico"/"App Padrão") - os
campos limpos já gravados pelo Apps Script.

**Saída**: o item original, mais `normalized` (booleanos/strings interpretados), `analysis`
(`risk_score`, `risk_level`, `recommendation`, `probability_score`, `probability_level`, `impact_score`,
`impact_level`) e `debug_score` (`criteria` com peso/dimensão/risco de cada um, usado por "Decisão
Técnica" pra ranquear os fatores que mais pesaram).

**Chamado por**: o node "App Crítico"/"App Padrão" no workflow (`Software Risk Assessment`).

## `nodes/decision/technical-decision.js` (Code node "Decisão Técnica")

**O que faz**: monta o texto do parecer técnico a partir do que "Gerador de Score" já calculou. Não
recalcula score nem normaliza nada - qualquer critério novo entra no Gerador de Score primeiro. Ranqueia
os critérios por contribuição real pro score (peso × risco, de `debug_score.criteria`) pra gerar
observações data-driven por submissão, em vez de texto fixo repetido em todo parecer - mesmo princípio
do `computeTopRiskFactors` do [`morpheus-beta`](https://github.com/domcabral9/morpheus-beta)
(`opinion-methodology.util.ts`). Monta também a seção "Respostas Completas" a partir de
`full_answers_json` (gerado pelo Apps Script), garantindo que nenhuma resposta coletada fica de fora do
parecer.

**Entrada**: a saída de "Gerador de Score".

**Saída**: o item original, mais `technical_opinion` (texto completo do parecer), `full_answers_text`,
`analysis_status`, e os campos usados como placeholders no Google Doc (`risk_score`, `risk_level`,
`recommendation`, `probability_score`, `probability_level`, `impact_score`, `impact_level`).

**Chamado por**: o node "Gerador de Score" no workflow.

## Nodes nativos do n8n (sem código próprio no repo)

Parâmetros de cada um vivem só em `workflows/software-risk-assessment.json` (exportado da instância) -
não há arquivo fonte separado, então a documentação aqui é a fonte de verdade sobre o que cada um faz.

| Node | Tipo | O que faz |
|---|---|---|
| Google Sheets Trigger | `googleSheetsTrigger` | Faz polling na aba `Normalizado`, dispara em `rowAdded`. |
| Normalização | Set/Edit Fields | Passthrough 1:1 dos campos já limpos pelo Apps Script - sem lógica de fallback. |
| Condição Crítica | IF | Ramifica por `app_criticality === "Crítica"` - dropdown fechado no formulário, match exato é seguro. |
| App Crítico / App Padrão | Set | Marca o ramo que a submissão seguiu (usado só pra rastreio no canvas, não afeta o cálculo). |
| Copiar Template | Google Drive (`copy`) | Copia o Doc-template pra um arquivo novo por submissão, nome dinâmico (`Parecer Técnico - {{app_name}} - {{form_timestamp}}`). |
| Update a document | Google Docs (`update`) | Find-and-replace de cada `{{campo}}` no Doc recém-copiado, usando `$('Decisão Técnica').item.json.<campo>` explícito (nunca `$json` bare - ver `docs/DEVELOPMENT.md` pro porquê). |
| Registrar Link do Parecer | Google Sheets (`appendOrUpdate`) | Escreve `parecer_doc_url` de volta na linha correspondente da aba `Normalizado`. |
