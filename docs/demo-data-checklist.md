# Checklist de dados de exemplo

Padrão de trabalho pra qualquer fixture, exemplo de saída ou captura de tela usada neste repositório
ou no README - versão simplificada de
[`morpheus-beta/docs/demo-data-checklist.md`](https://github.com/domcabral9/morpheus-beta/blob/main/docs/demo-data-checklist.md),
adaptada porque este projeto não tem um tenant `demo`/banco de dados pra popular: a fonte de dado é o
Google Forms real, e o problema que este checklist resolve de verdade é o que já aconteceu uma vez
neste repositório (`examples/higgsfild.json`, removido no PR #1): uma fixture escrita à mão, no formato
que o código *deveria* produzir, que nunca foi de fato gerada por uma execução real e acabou
desatualizada sem que ninguém notasse.

## A regra

**Todo exemplo (JSON de saída, texto de parecer, screenshot) vem de uma execução real do workflow
contra uma submissão real de teste no formulário - nunca é escrito à mão.**

Isso vale tanto pra um trecho de JSON colado numa doc quanto pra uma imagem de canvas do n8n ou o
próprio Google Doc de parecer usado como evidência no README.

## Por que isso importa aqui especificamente

Uma fixture escrita à mão representa a intenção de quem a escreveu no momento em que foi escrita, não
o comportamento real do código - e como não há teste automatizado rodando essa fixture contra o código
atual, ela nunca é invalidada quando o código muda. É exatamente o que aconteceu com
`examples/higgsfild.json`: parecia um exemplo real, mas escondia uma incoerência (`criticality`/
`hosting` marcados como "Não informado" apesar dos dados brutos estarem presentes) que só foi
percebida quando alguém comparou com o código de verdade.

## Como aplicar

1. **Gerar o exemplo rodando o workflow de verdade** (submissão real no Google Forms, ou "Execute
   workflow" no editor do n8n contra uma linha real já existente na aba `Normalizado`) - nunca simular
   a saída esperada manualmente.
2. **Registrar de onde veio** - qual submissão, quando foi gerada, se é a mesma usada em mais de um
   lugar (ex.: o mesmo parecer usado tanto num exemplo de doc quanto no README).
3. **Nunca revelar dado sensível real** em screenshot ou exemplo colado - nome de responsável, e-mail,
   contato. Usar as respostas de uma submissão de teste (marcada como tal no próprio formulário),
   nunca uma submissão real de um software efetivamente em avaliação.
4. **Regenerar o exemplo quando o código que o produz muda de forma visível no resultado** (mudança de
   formato de score, novo campo no parecer) - um exemplo desatualizado é pior que nenhum exemplo,
   porque parece atual sem ser.
