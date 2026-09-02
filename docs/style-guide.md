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

**Como aplicar**: antes de finalizar qualquer texto, escanear por "—" e reescrever usando um dos sinais
de pontuação acima.

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

**Como aplicar**: antes de criar qualquer commit ou PR, confirmar que nenhuma linha do tipo acima foi
incluída.
