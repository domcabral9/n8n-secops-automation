# n8n-secops-automation

Motor de avaliação de risco de software por trás de um processo real (ainda não oficialmente adotado)
da equipe de Segurança da Informação: um Google Forms de homologação de software vira, sem trabalho
manual, uma linha normalizada, um score de risco ponderado (Probabilidade x Impacto) e um parecer
técnico em Google Doc, um por submissão.

> **Status**: lógica core (normalização, score, parecer) reescrita e validada de ponta a ponta contra
> o formulário real (PR #1, mesclado). Ambiente ainda é uma VM de desenvolvimento local - a empresa vai
> disponibilizar um ambiente STG na nuvem corporativa mais adiante, o que muda o modelo de rede hoje
> (n8n só acessível via SSH tunnel, sem exposição direta).

Este arquivo é referência (stack, estrutura, como acessar o ambiente, gotchas). Diagrama do pipeline em
[`docs/architecture.md`](./architecture.md); documentação de cada script/node em
[`docs/nodes.md`](./nodes.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Automação | n8n Community Edition (self-hosted, Docker) |
| Intake | Google Forms |
| Normalização | Google Apps Script (bound ao Form, trigger `onFormSubmit`) |
| Armazenamento intermediário | Google Sheets (aba `Normalizado`, na mesma planilha do Form) |
| Saída | Google Docs (parecer técnico, um por submissão, copiado de um template no Drive) |
| Host do n8n | Ubuntu 22.04 LTS numa VM VirtualBox, Docker + Docker Compose |

Sem `package.json`/árvore de dependências própria além do que o container `n8nio/n8n` já traz - a
lógica de negócio inteira vive em dois Code nodes JavaScript (`nodes/risk/`, `nodes/decision/`) e um
Apps Script (`apps-script/`).

## Estrutura do repositório

```
n8n-secops-automation/
├── apps-script/
│   └── normalizacao.gs       # normalização por ID de pergunta, bound ao Form
├── nodes/
│   ├── risk/                 # motor de score (Code node "Gerador de Score")
│   └── decision/             # geração do parecer (Code node "Decisão Técnica")
├── workflows/
│   └── software-risk-assessment.json   # workflow completo, exportado da instância real
├── docs/
└── README.md
```

`workflows/software-risk-assessment.json` é a fonte de verdade versionada do desenho do pipeline -
qualquer mudança no editor do n8n precisa ser exportada e commitada de volta pra não divergir do que
está rodando ao vivo (ver gotcha de client-side cache abaixo).

**O que é commitado não é o export bruto.** Desde a limpeza de segurança de 2026-09-02, o export real
da instância tem IDs de recurso reais (planilha, template do Doc, pasta do Drive, IDs de credencial) e
o nome legível do formulário - nenhum disso vai pro repositório em texto puro. Antes de commitar um
export novo, substituir esses valores pelos placeholders já usados (`<SPREADSHEET_ID>`,
`<TEMPLATE_DOC_ID>`, `<DRIVE_FOLDER_ID>`, `<SHEET_GID>`, `<GOOGLE_*_CREDENTIAL_ID>`) - o mesmo vale pro
`apps-script/normalizacao.gs`, cujo `QUESTION_ID_MAP` real fica só no ambiente, nunca no git (o
commitado usa IDs fictícios sequenciais, mantendo a estrutura/nomes de campo).

## Acesso ao ambiente (dev, VM local)

VM VirtualBox (`n8n-poc`), rede bridged (não host-only, de propósito: mais de uma máquina na mesma rede
física precisa alcançar o mesmo ambiente), IP estático via netplan.

```bash
ssh n8n-poc                          # alias já configurado em ~/.ssh/config
docker ps                            # container "n8n" (n8nio/n8n)
docker exec n8n n8n export:workflow --id=<id> --output=/tmp/wf.json
docker exec n8n cat /tmp/wf.json     # ler o export de dentro do container
```

Editor web em `http://<ip-da-vm>:5678`, atrás de HTTP Basic Auth. Sem exposição além da rede local -
por design, até o ambiente STG resolver a questão de rede corporativa.

**Todos os IDs hardcoded neste repositório (planilha, perguntas do formulário, template do Doc, pasta
do Drive, credenciais OAuth) são específicos deste ambiente de desenvolvimento, não permanentes.**
Numa migração futura pro ambiente STG da empresa (VM local → nuvem corporativa), espera-se que a maioria
mude - especialmente se o Form for recriado em vez de só copiado (todo item ganha um ID interno novo).
Não tratar nenhum desses valores como fixo sem confirmar que o ambiente não mudou desde a última vez.

## Fluxo de PR

Mesmo ritmo do [`morpheus-beta`](https://github.com/domcabral9/morpheus-beta) (mesmo autor): branch →
implementar → validar → `gh pr create` → **aguardar confirmação explícita de merge** (nunca mesclar
proativamente) → merge → sincronizar `main`.

**Diferença real em relação ao morpheus-beta**: sem CI configurado ainda (não há testes automatizados
nem `package.json` - a validação hoje é manual, descrita abaixo). Não existe um segundo revisor humano
fixo neste projeto; a confirmação de merge é sempre verbal, como no morpheus-beta.

**Como validar antes de abrir PR**:

1. Testar a lógica dos Code nodes localmente com um harness Node.js simples (`new Function('$json',
   code)` simulando o global `$json`) contra perfis sintéticos - mais rápido que testar contra a
   instância real a cada iteração, e não gasta submissões de teste do formulário.
2. Aplicar a mudança na instância real (export → editar JSON → import → restart do container - ver
   gotchas abaixo) e confirmar via "Execute workflow" no editor, sempre depois de um F5 na aba.
3. Só depois de validado ao vivo, sincronizar o arquivo/workflow de volta pro repo e commitar.

## Manutenção do formulário (runbook)

Quando o Google Forms muda, a submissão seguinte grava `mapping_status = ATENÇÃO: <detalhe>` na aba
`Normalizado` (ver `checkMappingDrift_` em [`docs/nodes.md`](./nodes.md#apps-scriptnormalizacaogs)).
Ao ver esse aviso:

- **Pergunta nova**: abrir o editor de Apps Script vinculado ao Form (Extensões > Apps Script), rodar
  um `Logger.log(FormApp.getActiveForm().getItems().map(i => [i.getId(), i.getTitle()]))` pra pegar o
  ID, adicionar uma linha em `QUESTION_ID_MAP` (e `FIELD_LABELS`/`SECTION_GROUPS` se for pra aparecer
  na seção "Respostas Completas" do parecer), e avaliar se precisa entrar no motor de risco
  (`nodes/risk/risk-score-generator.js`) ou nos placeholders do Doc (`Update a document` no workflow).
- **Pergunta removida**: remover a entrada de `QUESTION_ID_MAP` (e `FIELD_LABELS`/`SECTION_GROUPS`), e
  revisar se algum critério do motor de risco dependia dela - remover uma pergunta booleana usada no
  score exige uma decisão explícita de como recalcular o peso total, não só apagar a linha.
- **Depois de qualquer mudança no Apps Script**: colar no editor vinculado ao Form e reautorizar a
  execução se pedido (ação do lado do Google, fora do alcance via SSH/API).

## Problemas conhecidos do ambiente

### `n8n execute` (CLI) não serve pra testar o workflow

As três variantes (`--id`, `--file`, via `docker exec`) sobem uma instância n8n nova completa dentro do
mesmo container, que tenta abrir o Task Broker na porta 5679 - já ocupada pelo servidor principal
ativo. Sempre dá "port 5679 is already in use", não é questão de sintaxe do comando. Usar o botão
"Execute workflow" no editor web pra testar manualmente.

### Editar o workflow via CLI/SSH não aparece numa aba do editor já aberta

O editor do n8n carrega o workflow pra memória da aba do navegador ao abrir; "Execute workflow" testa o
que está **carregado na aba**, não o que está salvo no backend. Depois de qualquer edição por fora
(export → editar JSON → import → restart), se a aba já estava aberta de antes, ela continua rodando a
versão antiga até um F5 - sem nenhum erro visível, só resultado desatualizado (placeholders vazios,
score com a fórmula antiga). **Sempre recarregar a aba do editor depois de uma edição via CLI, antes de
testar de novo.**

### Importar um workflow sempre desativa; `--active=true` exige restart

`n8n import:workflow` desativa o workflow importado ("Remember to activate later"). `n8n
update:workflow --id=<id> --active=true` reativa no banco, mas o próprio comando avisa: "Changes will
not take effect if n8n is running" - precisa de `docker restart n8n` depois, sempre, mesmo já tendo
rodado o comando de ativação.

### `$json` dentro de um node é o do node anterior na cadeia, não qualquer node upstream

Depois que um node roda, `$json` dentro do próximo node se refere à saída **desse node imediatamente
anterior**, não de qualquer outro node mais acima no fluxo. Se "Update a document" roda depois de
"Copiar Template" (Drive) mas precisa dos dados calculados por "Decisão Técnica" (mais acima), usar
`$json` bare pega os campos errados (id/nome do arquivo copiado, não score/parecer) - use `$('Nome do
Node').item.json.campo` explícito sempre que o node imediatamente anterior não for quem produziu o
dado que você quer.

### Google Docs API exige string em `replaceAllText`, mesmo pra placeholder numérico ou de data

Uma expressão n8n que referencia só um campo (`={{ $json.campo }}` ou `={{ $now }}`) devolve o tipo
nativo do dado, não uma string - se o campo é um number (`risk_score`, `probability_score`,
`impact_score`) ou um objeto de data (`$now`, um `DateTime` do Luxon), a chamada à API do Google Docs
falha com `Invalid value ... (TYPE_STRING)`. Sempre forçar string explícita na expressão: `.toString()`
pra número, `.toFormat('dd/MM/yyyy HH:mm')` (ou equivalente) pra `$now`.

### Trigger instalável do Apps Script pode parar de disparar silenciosamente

Sintoma: o formulário recebe a resposta normalmente (aparece em "Form Responses 1"), mas nenhuma linha
nova aparece em `Normalizado` - e o painel "Execuções" do Apps Script não mostra nem uma tentativa
(nem sucesso, nem erro) desde um certo ponto no tempo. Não é bug no código do script - é o registro do
trigger no lado do Google que parou de funcionar (causa mais provável: autorização expirada/revogada
silenciosamente). Diagnóstico: abrir "Acionadores" e conferir a data da última execução; se estiver
muito atrasada em relação a submissões reais que deveriam ter disparado, apagar o trigger e criar um
novo do zero (função `onFormSubmit`, origem "Do formulário", evento "Ao enviar formulário") - isso força
o Google a pedir reautorização, o que resolve a maioria dos casos.

**Rodar a função `onFormSubmit` direto no editor (botão "Executar") não é um teste válido**: sem um
evento de submissão real, `e` chega vazio e `e.response` quebra com `TypeError: Cannot read properties
of undefined (reading 'response')` - isso não indica um bug, só que a função precisa de uma submissão
real pelo formulário pra ser testada.

### Colar texto no Google Doc pode corromper o placeholder sem aviso

`replaceAllText` da API do Google Docs faz busca literal de substring. Colar um placeholder (`{{campo}}`)
de outra fonte (chat, outro doc) já teve o efeito de trocar um caractere por um visualmente idêntico,
fazendo a busca não encontrar nada - sem erro nenhum, só o token ficando sem substituir. Sintoma
enganoso: se a substituição *encontra* o token mas o campo referenciado está `undefined` (por exemplo,
um Code node desatualizado que ainda não calcula aquele campo), o resultado é o token **removido e
deixado em branco**, não um erro visível - os dois sintomas (não encontrado vs. encontrado só que
vazio) parecem iguais no Doc final e exigem checar a execução (ver abaixo) pra diferenciar. Preferir
digitar o placeholder direto no Google Docs em vez de colar, quando precisar bater literalmente.

### Inspecionar a execução real quando o editor não é suficiente

O painel de execução do editor (aba "Output" de cada node) já resolve a maioria dos casos. Quando não
é suficiente (comparar o dado bruto entre duas execuções, por exemplo), o n8n guarda os dados de
execução no SQLite do próprio container (`/home/node/.n8n/database.sqlite`, tabela `execution_data`),
serializados num formato próprio de flatten (cada valor vira um índice numérico, referenciado por
outros valores) - dá pra ler com o driver `sqlite3` já empacotado dentro da própria instalação do n8n
(`/usr/local/lib/node_modules/n8n/node_modules/sqlite3`, sem precisar instalar nada) e um resolvedor
recursivo simples desse formato.

### Reconectar uma credencial Google pode invalidar outra sem aviso

As 4 credenciais OAuth do n8n (Sheets Trigger, Sheets, Docs, Drive) compartilham o mesmo Client ID do
Google Cloud. Reconectar uma pode estourar a cota de refresh token e invalidar outra silenciosamente
(`invalid_grant` aparecendo em credenciais que não foram tocadas). Se isso acontecer: checar
`myaccount.google.com/permissions` por um grant duplicado/sem nome do mesmo app, removê-lo, e
reconectar as 4 credenciais numa única sessão, seguido de `docker restart n8n`.

### Google Sheets converte silenciosamente texto livre "parecido com número" pro tipo number

Uma resposta de texto livre do formulário (ex.: versão do software `"103"`) pode virar um valor
`number` de verdade na célula da planilha, mesmo respondida como texto - é o comportamento padrão do
Sheets de auto-detectar tipo em qualquer escrita, não só via UI. O n8n lê o valor já como number, e
qualquer placeholder do Google Doc alimentado por esse campo quebra com o mesmo erro `TYPE_STRING`
descrito acima, mesmo sendo um campo de texto (não um score numérico). Por isso o node "Update a
document" força `.toString()` explícito em **todos** os campos, não só nos que já são number por
natureza - qualquer campo de texto livre é candidato a essa conversão silenciosa.

### VM travou com o filesystem em somente leitura (`EXT4-fs error... Detected aborted journal`)

Sintoma: `docker exec` falha com `OCI runtime exec failed: open /tmp/runc-process<N>: read-only file
system`, mesmo com `docker ps`/`mount` mostrando tudo normal (`rw,relatime`) - o mount flag mente,
`touch /tmp/algo` confirma de verdade (`Read-only file system`). Causa raiz confirmada via
`journalctl -k | grep -i ext4`: o journal do ext4 abortou (`Detected aborted journal`), provavelmente
ligado a alguma instabilidade anterior da VM (freeze, reset abrupto), e o kernel remontou `/` como
somente-leitura por proteção. Corrigido com um reset da VM (`VBoxManage controlvm n8n reset`) - o
journal foi refeito automaticamente no boot seguinte, sem precisar de `fsck` manual/interativo dessa
vez. Se aparecer de novo e o boot pedir confirmação interativa de `fsck` no console, só dá pra resolver
com acesso à janela da VM (não via SSH).

### `sudo` sem `su -` deixa `$HOME` errado

Um shell aberto via `sudo` (sem o `-`) mantém `$HOME` do usuário original - `~/.ssh/authorized_keys`
nesse contexto aponta pro home errado. Usar o caminho absoluto (`/home/<usuario>/.ssh/authorized_keys`)
em vez de `~` em qualquer comando rodado assim.

### IP estático numa rede bridged pode colidir com o próprio host

Ping "sem resposta" antes de fixar um IP não é garantia suficiente de que ele está livre numa rede
bridged - o host que está rodando a VM também é um dispositivo nessa mesma rede. Checar o IP do próprio
host (`ipconfig`/`ip a`) antes de escolher um IP estático pra VM, não só testar ping contra candidatos.
