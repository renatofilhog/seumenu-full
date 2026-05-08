# ERPFood Back

## Objetivo do sistema
O ERPFood Back e a base de dados e regras para operacao de restaurantes. Ele organiza o cadastro de pessoas,
permissões, produtos, adicionais e mesas, permitindo que outros sistemas (site, app, PDV ou painel)
consumam as informacoes de forma padronizada.

## Visão de Documentação
- Investidor: entender o que já esta pronto, o nivel de maturidade e o potencial de escalabilidade.
- Cliente final: entender o que o sistema resolve hoje e como pode ser usado no dia a dia.

## Proposta de valor (Comercial)
- Centraliza o cardápio, adicionais e mesas em uma única base confiavel.
- Organiza a operação com usuários, papéis e permissões. Estrutura pronta para governanca.
- Permite evoluir para um ecossistema completo (pedidos, pagamentos, delivery) sem refazer a base.

## Beneficios por público
#### Para investidor:
- Produto com dominio base estruturado (cardápio, adicionais, mesas, usuarios).
- Base pronta para MVP de operação e evolução incremental.
- Seeds iniciais permitem demonstração imediata do produto.
- Estrutura modular facilita adicionar novos módulos sem reescrever o core.

#### Para cliente final:
- Controle do cardápio por grupos e produtos ativos/inativos.
- Flexibilidade para vender adicionais (aumenta ticket medio).
- Organização de mesas para operação presencial.
- Cadastro de equipe para preparar futuras regras de acesso.

## O que já esta entregue

### 1) Gestão de usuários
Entrega comercial:
- Cadastro, consulta, atualização e exclusão de usuários.
- Cada usuário pode estar vinculado a um papel (role) com conjunto de permissões.

Regras de negocio:
- Email único por usuario.
- Usuário possui nome, email e senha.
- Usuário tem um papel associado (role).

Valor para o negocio:
- Permite controlar quem acessa o sistema e com quais responsabilidades.


### 2) Gestão de papéis (roles)
Entrega comercial:
- Cadastro, consulta, atualização e exclusão de papéis de acesso.

Regras de negocio:
- Cada papel possui nome e descrição.
- Papéis podem ter um conjunto de permissões.

Valor para o negocio:
- Facilita a organização de equipes (ex: Administradores, Atendentes, Gerentes).


### 3) Gestão de permissões
Entrega comercial:
- Cadastro, consulta, atualização e exclusão de permissões.

Regras de negocio:
- Cada permissão possui nome e descrição.
- Permissões podem ser ligadas a papéis (roles).

Valor para o negocio:
- Permite criar regras finas de acesso para funcionalidades futuras.


### 4) Gestão de grupos de produto
Entrega comercial:
- Cadastro, consulta, atualização e exclusão de grupos de produto.
- Ideal para montar cardápio por categoria.

Regras de negocio:
- Grupo tem nome, status (ativo/inativo) e ordem de exibicao.

Valor para o negocio:
- Organiza o cardápio e facilita navegacao do cliente ou operador.


### 5) Gestão de produtos
Entrega comercial:
- Cadastro, consulta e atualização de produtos.
- Produto pode ser vinculado a um ou mais grupos.
- Produto pode ter adicionais opcionais.

Regras de negocio:
- Produto tem nome, descrição, preco, status (ativo/inativo), imagem e ordem.
- Grupo(s) informado(s) devem existir.
- Adicionais são opcionais.

Valor para o negocio:
- Mantem o cardápio centralizado com preços e status atualizados.
- Permite montar produtos com complementos.


### 6) Gestão de adicionais
Entrega comercial:
- Cadastro, consulta e atualização de adicionais.
- Adicional pode ser associado a produtos.

Regras de negocio:
- Adicional tem nome, preco, status (ativo/inativo) e quantidade maxima permitida.
- Se informado, os produtos precisam existir.

Valor para o negocio:
- Gera receita extra com upsell (ex: queijo, bacon, extras).


### 7) Gestão de mesas
Entrega comercial:
- Cadastro, consulta e atualização de mesas.

Regras de negocio:
- Mesa tem numero, descrição, setor e status (ativo/inativo).

Valor para o negocio:
- Suporte para operacao presencial com organização de salas/setores.


## Regras e pontos importantes do negocio
- Sistema focado em cadastro e organização da base de dados do restaurante.
- Possui estrutura para controle de acesso por papéis e permissões.
- Produtos podem ser organizados por grupos e vinculados a adicionais.
- Existe suporte a mesas, o que abre caminho para atendimento presencial.


## O que ja esta pronto para uso imediato
- Todas as funcoes de cadastro e consulta listadas acima.
- Documentacao interativa da API (Swagger) para testes rapidos.
- Seeds iniciais com usuario administrador e exemplo de produto.

## Cenarios de uso (exemplos praticos)
- Restaurante pequeno: cadastra grupos (Pizzas, Burgers), cria produtos e adicionais, organiza mesas por setor.
- Restaurante medio: padroniza catalogo entre unidades e controla quem cadastra/atualiza cardápio.
- Operacao em crescimento: usa a base para iniciar um app de pedidos ou um PDV integrado.

## Demonstacao para investidor
O produto pode ser demonstrado com uma jornada simples:
- Acessar a lista de grupos de produto e produtos ja seedados.
- Mostrar um produto com adicional vinculado (ex: queijo).
- Mostrar a existencia de usuarios e papéis (admin por seed).
- Explicar como novas camadas (pedidos, pagamento) entram sem refazer o cadastro base.


## Como pode ser utilizado no negocio (na pratica)
- Painel administrativo interno para cadastrar produtos, grupos e adicionais.
- PDV ou app para consultar cardápio e montar pedidos com adicionais.
- Modulo de administracao de usuarios para definir equipe e acessos.
- Controle de mesas para atendimento no local.


## Possibilidade de evolucao imediata (proximas entregas sugeridas)
- Autenticacao com token (login).
- Aplicacao real de permissão por papel.
- Modulo de pedidos (mesas, delivery, retirada).
