# Guia de estilo de escrita

Convenções de texto para qualquer conteúdo deste projeto (comentário de código, mensagem de commit,
corpo de PR, este próprio conjunto de docs, README, e texto de CV/LinkedIn sobre o projeto). O
objetivo comum às regras abaixo: texto que soa como foi escrito por uma pessoa pensando no leitor, não
texto que carrega os tiques de padding característicos de saída de LLM sem revisão.

Reaproveitado de [`morpheus-beta/docs/style-guide.md`](https://github.com/domcabral9/morpheus-beta/blob/main/docs/style-guide.md)
(projeto irmão do mesmo autor) - as mesmas três regras valem aqui, sem adaptação de conteúdo, só de
escopo (nome do projeto).

## Nunca usar travessão ("—")

Nenhum texto deste projeto usa o caractere "—" (em-dash), em nenhuma língua. Usar ponto, vírgula,
dois-pontos ou parênteses no lugar.

**Por quê**: em-dash deixa o texto "muito na cara que foi gerado por LLM" - é um dos tiques de
pontuação mais característicos de saída de IA sem revisão humana, e qualquer texto deste projeto lido
por um avaliador externo deveria parecer escrito por alguém pensando no leitor, não colado direto de
um modelo.

**Escopo**: tudo que entra no histórico do repositório ou fica visível a um leitor externo - comentário
de código, mensagem de commit, corpo de PR, README, esta própria documentação, texto de CV/LinkedIn.

**Como aplicar**: bloqueado automaticamente por `scripts/check-style.mjs` - roda via hook do Claude Code
(`.claude/settings.json`, `PostToolUse` em qualquer edição de `.md`) e via CI (`.github/workflows/
style-check.yml`) em todo PR. Regra mecânica, sem falso positivo possível - a única exceção é este
próprio arquivo, que precisa citar o caractere como exemplo.

## Evitar contrastes negativos redundantes

Um padrão comum em texto gerado por LLM: afirmar algo e logo em seguida negar uma alternativa óbvia
que ninguém cogitaria de qualquer forma, só pelo efeito de ênfase - "X (não só Y)", "X, e não apenas
Y", "X, não Y". Isso deixa a escrita técnica repetitiva e cansativa quando usado sem necessidade.

**Não é uma regra contra contraste em si.** Contrastar uma alternativa real e plausível que o leitor
poderia genuinamente supor é informação útil, não padding. O problema é quando a parte negada não
acrescenta nada que o leitor não já soubesse.

**Teste prático antes de manter um contraste negativo**: remover a parte negada mentalmente e
perguntar - o leitor perde alguma informação real que ele não teria adivinhado sozinho? Se a resposta
for não, cortar.

**Como aplicar**: `scripts/check-style.mjs` lista candidatos (padrão "X (não/nunca Y)" ou ", não/nunca
Y") toda vez que um `.md` é editado (hook) e em todo PR (CI), mas **nunca bloqueia** - é uma regra
semântica, não mecânica (auditoria real: ~30 candidatos nos docs existentes deste repo, só 1 era
violação de verdade). Cada candidato listado precisa passar pelo teste prático acima manualmente antes
de considerar o texto pronto - foi exatamente esse teste, rodado tarde demais, que pegou a violação real
que motivou este mecanismo (README, frase de abertura: "Automação real (não um exercício hipotético)").

## Nunca nomear o empregador real

Nenhum texto deste projeto nomeia a empresa real por trás do processo que o motivou - sempre "a
empresa"/"ambiente corporativo", nunca o nome próprio, mesmo quando o contexto deixa claro que existe
um empregador real.

**Por quê**: o projeto descreve, com bastante detalhe, o processo interno de segurança de uma empresa
real (estrutura do formulário, critérios de risco, nomes de área) - nomear o empregador transformaria
documentação técnica de portfólio em divulgação de processo interno vinculada a uma empresa
identificável, o que não é apropriado independente de quão genérico o conteúdo pareça.

**Escopo**: mesmo escopo das regras acima - comentário de código, commit, PR, README, esta própria
documentação.

**Como aplicar**: antes de finalizar qualquer texto, escanear por menções ao nome real do empregador e
substituir por "a empresa" ou equivalente genérico.

## Nenhuma assinatura de ferramenta de IA nos artefatos do projeto

Este projeto é construído com apoio de ferramentas de IA, mas os artefatos que produz (commits, corpo
de Pull Request, comentários) nunca carregam assinatura, rodapé, trailer de co-autoria ou qualquer
outra marca vinculando o artefato a uma ferramenta/fornecedor de IA específico.

**Por quê**: o uso de IA no desenvolvimento já é declarado de forma explícita em outros lugares (perfis
profissionais do autor) - não precisa, e não deve, ser repetido dentro do próprio repositório. Um
commit ou uma PR devem ser lidos como o trabalho do autor do projeto, ponto final.

**Escopo**: mensagem de commit (nenhum trailer `Co-authored-by`/similar), corpo de Pull Request (nenhum
rodapé tipo "Gerado com..."), comentários em qualquer sistema onde o projeto vive (GitHub, Trello).

**Como aplicar**: `scripts/check-style.mjs` bloqueia automaticamente trailers `Co-Authored-By` (Claude/
Anthropic) e rodapés "Generated with Claude Code" em qualquer `.md`, via hook e via CI - mesmo mecanismo
das duas regras acima. Commits e PRs em si (não são arquivo `.md`) continuam sob revisão manual antes de
criar: confirmar que nenhuma linha do tipo acima foi incluída.

## Enforcement mecânico: por que hook + CI, não só revisão manual

Até 2026-09-27, as 4 regras acima existiam só como texto aqui, com a instrução "escanear antes de
finalizar" - ou seja, o único mecanismo de verificação era alguém (ou uma IA) lembrar de checar, toda
vez, sem nenhum artefato que pegasse um esquecimento. Isso já falhou duas vezes: um em-dash real em
`docs/DEVELOPMENT.md` numa sessão anterior, e o contraste negativo redundante na primeira frase do
README que motivou este mecanismo. `scripts/check-style.mjs` (chamado por `.claude/settings.json` e por
`.github/workflows/style-check.yml`) fecha essa lacuna pras duas regras 100% mecânicas (em-dash,
assinatura de IA) - continuam bloqueadas mesmo que ninguém lembre de olhar. A regra de contraste
negativo continua exigindo julgamento (o teste prático não é automatizável sem gerar falso positivo em
massa), mas agora pelo menos todo candidato aparece automaticamente, em vez de depender só de memória.
