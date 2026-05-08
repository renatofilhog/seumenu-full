# Requisitos - Painel Estabelecimento (Backend API)

## Escopo geral
Implementar backend para gestão de produtos e mesas, incluindo migrations, entities, DTOs, relacionamentos, CRUDs e endpoints necessários. Atentar na documentação do swagger com @ApiProperty e os @ApiOkResponse conforme os que já foram criados.

## 3. Painel Estabelecimento - Grupo Produtos
- Campos: `nome`, `ativo`, `ordem`, `created_at`, `updated_at`.
- CRUD completo (leitura, cadastro, atualização, exclusão).

## 4. Painel Estabelecimento - Produtos
- Campos: `nome`, `descricao`, `preco`, `ativo`, `imagem_url`, `ordem` (opcional).
- Relacionamentos:
  - Produto pertence a um grupo (`grupo_id`).
  - Produto possui vários adicionais (many-to-many).
- Operações: leitura, cadastro, atualização.

## 5. Painel Estabelecimento - Adicionais
- Campos: `nome`, `quantidade_max`, `preco`, `ativo`.
- Operações: leitura, cadastro, atualização.
- Relacionamentos:
  - Adicional vinculado a produtos (many-to-many).

## 6. Painel Estabelecimento - Mesas
- Campos: `numero`, `descricao`, `setor`, `ativo`.
- Operações: leitura, cadastro, atualização.

## Requisitos técnicos
- Criar migrations para todas as novas tabelas e tabelas de junção.
- Criar entities e relacionamentos no TypeORM.
- Criar DTOs de criação/atualização (validadores conforme tipo).
- Ajustar módulos/serviços/controladores para expor endpoints.
- Garantir consistência de timestamps e nomes de colunas.
