# Portfólio: quando e como atualizar

Este documento é sobre como o projeto é **apresentado** para fora (README, CV/LinkedIn), diferente de
[`docs/DEVELOPMENT.md`](./DEVELOPMENT.md), que é sobre como o projeto funciona por dentro. Adaptado de
[`morpheus-beta/docs/portfolio.md`](https://github.com/domcabral9/morpheus-beta/blob/main/docs/portfolio.md)
(mesmo autor, mesmos princípios), com uma diferença real de plataforma: o n8n não tem uma UI própria
navegável pra capturar como o Morpheus faz com Playwright, então a "evidência" aqui é outro conjunto de
artefatos.

## A regra de decisão: quando vale atualizar

Mesma regra do morpheus-beta: uma atualização de portfólio só se justifica quando **(a)** uma evidência
já presente no README muda de verdade (o modelo de score muda, o diagrama de arquitetura fica
desatualizado), ou **(b)** uma evidência nova é candidata genuína a entrar no README (um marco real
fechado, como o fim de uma fase do plano).

Não é "qualquer commit dispara recaptura" - só mudanças que carregam a apresentação do projeto como um
resumo fiel do que ele faz hoje.

## O que conta como evidência aqui

Sem UI própria pra navegar, as três evidências reais deste projeto são:

1. **Screenshot do canvas do workflow no editor do n8n** - mostra o desenho real do pipeline (nodes,
   conexões), não uma descrição em prosa de como ele funciona.
2. **Um parecer técnico gerado de exemplo** (Google Doc, ou o texto extraído dele) - a partir de uma
   submissão de teste real, nunca um texto inventado pra parecer melhor. Ver
   [`docs/demo-data-checklist.md`](./demo-data-checklist.md).
3. **O diagrama de arquitetura** (`docs/architecture.md`) - fluxo real do pipeline, mantido sincronizado
   com o workflow de verdade, não um desenho aspiracional de como o pipeline deveria ser um dia.

## Dado usado na captura: sempre real

Nenhuma evidência de portfólio é fabricada à mão só pra sair uma tela ou um texto mais "bonito" - o
mesmo princípio do morpheus-beta. Se o resultado real de uma submissão de teste for menos dramático que
um hipotético, o resultado real é o que fica.

## Timing: etapa de fechamento, não item adiado

"No final do milestone" significa agora, como a última etapa de um arco de trabalho recém-fechado, não
um lote maior adiado pra uma sessão futura - mesma leitura já corrigida no morpheus-beta.

## Texto que acompanha o portfólio

O texto de apresentação (README, CV, LinkedIn) precisa "vender a ideia": o problema real que o projeto
resolve (automação que hoje depende de copy-paste manual e quebra silenciosamente), não só a lista de
tecnologias usadas. Style guide de escrita (sem em-dash, sem contraste negativo redundante) em
[`docs/style-guide.md`](./style-guide.md) vale igual aqui.
