# Design Guidelines Summary (Fase A)

## Paleta (base de cor.pdf + Componentes)
### Verde-mar
- 50 `#F0F9F2`
- 100 `#DAF1DF`
- 200 `#B8E2C3`
- 300 `#8ACB9F`
- 400 `#58AF77`
- 500 `#37945B`
- 600 `#267546`
- 700 `#1E5E3A`
- 800 `#1A4B2F`
- 900 `#163E28`
- 950 `#0C2217`

### Cello (azul)
- 50 `#F3F6FC`
- 100 `#E7EEF7`
- 200 `#C9D9EE`
- 300 `#9AB8DF`
- 400 `#6497CC`
- 500 `#4079B7`
- 600 `#2F609A`
- 700 `#274C7D`
- 800 `#244268`
- 900 `#233A59`
- 950 `#17253A`

### Dove Gray (neutros)
- 50 `#F5F6F6`
- 100 `#E6E7E7`
- 200 `#CFD1D2`
- 300 `#AEB1B2`
- 400 `#85898B`
- 500 `#6B6F72`
- 600 `#5A5D60`
- 700 `#4D4F51`
- 800 `#434547`
- 900 `#3B3C3E`
- 950 `#252527`

### Feedback/Status (componentes + pedidos)
- Solicitado: `#2FB9D5`
- Em preparo: `#D1570B`
- Finalizado: `#AEB1B2`
- Cancelado: `#FF0000`
- Sucesso/ativo: `#06A759`

## Tipografia
- Família: **Mulish**
- Pesos: 500 / 700 / 800 / 900
- Tamanhos recorrentes (mobile): 10px, 14px, 15px, 16px, 20px
- Hierarquia: título seção ~20px/800, card título ~16px/800, textos ~14–15px/700

## Espaçamento, raios e sombras
- Escala de espaçamento: 4, 8, 12, 16, 20, 24
- Raios: 8px (chips/cards), 16px (inputs/cards), 42px (bottom bar pill)
- Sombras: `0px 4px 4px rgba(0,0,0,0.04~0.06)`

## Componentes (Componentes.pdf / componentes.html)
- Tabs/Filtros (chips): normal/inativo em cinza, ativo em verde, com ícone
- Badges de status: pílulas com cor sólida por status
- Card de pedido (lista): imagem 100x100 com raio 10 + título/descrição/status
- Bottom bar (mobile): 3 ações, item ativo com bolha verde suave atrás
- Header/top bar (mobile): faixa azul escura, logo circular e sino
- Search input: campo arredondado, sombra leve, ícone de lupa
- Switch: toggle verde com knob branco

## Estrutura da tela de Pedidos (mobile)
- Header
- Busca rápida (título + input)
- Status dos pedidos (título + chips)
- Lista de pedidos (cards empilhados)
- Bottom nav
- Variante de detalhe do pedido (card ampliado com status + itens + tempo/fila)

## Mapa de UI
- Tokens: cores (verde/cello/dove gray + status), fontes (Mulish), raios, sombras, espaçamento
- Componentes base: Button, Input com ícone, Tabs/Filter chips, Badge, Card de pedido, Card de detalhe, Bottom nav, Header
- Páginas priorizadas: **Pedidos** (mobile-first), depois ajustes desktop
