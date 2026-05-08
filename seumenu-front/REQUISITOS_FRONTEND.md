# Requisitos do Frontend - Projeto Seu Menu

## 1. Visão Geral
Este documento detalha os requisitos para o desenvolvimento do frontend do projeto **Seu Menu**, um sistema de gestão de pedidos e cardápio digital. O desenvolvimento será dividido em duas etapas principais.

## 2. Escopo do Desenvolvimento

### 2.1. Etapa 1: Frente do Estabelecimento (Painel do Mantenedor)
Esta etapa foca na interface administrativa utilizada pelos gestores e funcionários do estabelecimento. O objetivo é permitir o controle total das operações do negócio, desde a gestão de usuários até o acompanhamento de pedidos em tempo real.

#### 2.1.1. Identidade Visual e Branding
*   O layout deve seguir rigorosamente as diretrizes propostas na **Apresentação Branding Seu Menu**.
*   Devem ser utilizadas as cores, tipografia e logotipos definidos no manual de identidade visual.
*   A interface deve ser responsiva, permitindo o uso tanto em desktops quanto em tablets para operação interna.

#### 2.1.2. Requisitos Funcionais (Operações de Mantenedor)
O sistema deve implementar todas as operações descritas na documentação do backend, organizadas nos seguintes módulos:

**A. Gestão de Acesso (Usuários e Permissões):**
*   **Usuários:** Listagem, criação, edição e exclusão de usuários do sistema.
*   **Papéis (Roles):** Definição de perfis de acesso (ex: Administrador, Garçom, Cozinheiro).
*   **Permissões:** Controle granular do que cada papel pode visualizar ou operar.

**B. Gestão de Cardápio (Produtos e Organização):**
*   **Grupos de Produtos:** Cadastro de categorias (ex: Bebidas, Pizzas, Sobremesas) com controle de ordem de exibição e status (ativo/inativo).
*   **Produtos:** Gestão completa de itens, incluindo nome, descrição, preço, imagem, ordem de exibição e associação a grupos.
*   **Adicionais:** Cadastro de complementos que podem ser vinculados aos produtos (ex: "Borda recheada", "Gelo e limão"), com controle de quantidade máxima e preço.

**C. Infraestrutura e Operação:**
*   **Mesas:** Gestão das mesas do estabelecimento (número, setor, descrição e status).

**D. Gestão de Pedidos e Fluxo de Trabalho:**
*   **Listagem de Pedidos:** Visualização detalhada de todos os pedidos realizados.
*   **Gestão de Itens do Pedido:** Consulta e atualização de itens específicos dentro de um pedido.
*   **Painel Kanban (Status de Pedidos):**
    *   Visualização em colunas (Em análise, Preparando, Feito).
    *   Atualização de status via interface (drag-and-drop ou botões de ação).
    *   **Atualização em Tempo Real:** O sistema deve consumir o stream de atualizações para manter o painel sincronizado sem necessidade de refresh manual.

### 2.2. Etapa 2: Frente do Cliente
A segunda frente do projeto consistirá na interface voltada para o consumidor final (cliente), permitindo a visualização do cardápio e realização de pedidos de forma autônoma.
*(Nota: Os detalhes desta etapa serão fornecidos futuramente e não devem ser detalhados neste momento.)*

## 3. Requisitos Técnicos Sugeridos
*   **Framework:** Next.js (conforme estrutura atual do projeto).
*   **Consumo de API:** Integração com a API descrita no arquivo `backend-documentation.yaml`.
*   **Estilização:** Tailwind CSS ou ferramenta similar que permita a aplicação precisa do branding.
