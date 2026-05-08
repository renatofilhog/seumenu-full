# ERPFood Back - Sprint 2

## Objetivo do documento
Registrar o que ja foi entregue no Sprint 2 para demonstracao comercial e alinhamento de produto.

## Visao de Documentacao
- Investidor: entender o que avancou em pedidos e operacao, com destaque para status em tempo real.
- Cliente final: visualizar como o back apoia o painel de pedidos e a base do cardapio.

## Proposta de valor (Comercial) - Sprint 2
- Painel de pedidos com dados completos e atualizacoes rapidas.
- Itens de pedido com produtos e adicionais vinculados.
- Status do pedido em kanban com atualizacao em tempo real (SSE).
- Base pronta para montar o cardapio com grupos e produtos ordenados.

## O que ja esta entregue (Sprint 2)

### 1) Painel Estabelecimento - Pedidos
Entrega comercial:
- API de pedidos com criacao, consulta geral, consulta por ID e atualizacao.
- Retorno de pedidos ja inclui mesa e itens vinculados (produto e adicionais).

Regras de negocio:
- Numero do pedido e unico.
- Mesa obrigatoria e validada.
- Status controlado por enum (em_analise, preparando, feito).
- Valor liquido, desconto e total obrigatorios.

Valor para o negocio:
- Painel consegue listar pedidos com contexto completo para atendimento.
- Base pronta para operar com descontos e cupom.

### 2) Painel Estabelecimento - Itens de Pedido
Entrega comercial:
- API de itens com consulta geral, consulta por ID e atualizacao.
- Itens retornam pedido, produto e adicionais vinculados.

Regras de negocio:
- Pedido e produto informados devem existir.
- Adicionais sao validados quando informados.
- Valores unitario, desconto e total obrigatorios.

Valor para o negocio:
- Permite ajustar itens e adicionais sem refazer o pedido inteiro.

### 3) Painel Estabelecimento - Status do Pedido
Entrega comercial:
- API de status com lista de opcoes e kanban por coluna.
- Atualizacao de status via PATCH.
- Stream SSE para notificacoes em tempo real.

Regras de negocio:
- Status limitado a em_analise, preparando e feito.
- Atualizacao de status dispara evento no stream.

Valor para o negocio:
- Operacao visual por kanban com atualizacao imediata de mudancas.

### 4) Cliente Final - Cardapio (Base)
Entrega comercial:
- Grupos de produto possuem ordem e status (ativo/inativo).
- Produtos possuem imagem, preco, ordem e status.
- APIs existentes para consulta de grupos e produtos.

Regras de negocio:
- Produto sempre vinculado a um ou mais grupos.
- Ordem de exibicao ja registrada nos grupos e produtos.

Valor para o negocio:
- Informacoes essenciais para montar cardapio no site ou app.

## Pontos importantes do Sprint 2
- Status em tempo real usa SSE, pronto para painel ao vivo.
- Entidades de pedidos e itens ja suportam descontos e cupons.
- Estrutura de cardapio depende da ordenacao no cliente enquanto nao existir endpoint agregado.

## Possibilidades de evolucao imediata
- Endpoint dedicado para cardapio agrupado por grupo e ordenado.
- Filtro por ativo/inativo nas consultas de grupos e produtos.
- Fluxo completo de criacao de itens com rota publica (POST).
