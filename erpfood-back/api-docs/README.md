# ERPFood Back - Documentacao Tecnica (modulos, regras e uso)

## Visao geral
Esta aplicacao e uma API REST em NestJS (TypeScript) com persistencia em Postgres via TypeORM.
A aplicacao expoe endpoints CRUD para varios dominios (usuarios, roles, permissoes, grupos de produto,
produtos, adicionais e mesas). Ha tambem configuracao de Swagger para navegacao e testes da API.

Pontos principais:
- Framework: NestJS com controllers/servicos por modulo.
- Banco: Postgres (TypeORM) com entidades em `src/**/entities/*.entity.ts`.
- Migrations: Knex em `migrations/` (inclui seeds).
- Documentacao interativa: Swagger em `/api-docs`.
- Autenticacao: nao ha autenticacao/guardas implementadas no codigo atual.
- Validacoes: DTOs usam class-validator, mas nao ha `ValidationPipe` global no bootstrap,
  portanto as validacoes nao sao aplicadas automaticamente no runtime.

## Como pode ser usada (meios de uso)
1) Via HTTP/REST
- Consumir os endpoints diretamente com qualquer cliente HTTP (curl, Postman, Insomnia, etc.).

2) Via Swagger (UI)
- A aplicacao sobe com Swagger configurado em `/api-docs`.
- A UI permite testar todos os endpoints disponiveis.

3) Via integracao interna (uso por outros servicos)
- Outros servicos podem integrar consumindo a API REST diretamente.

## Como sera usada (fluxo tipico)
- Subir o banco Postgres.
- Aplicar migrations (se optar por criar a estrutura via Knex).
- Subir a API.
- Consumir endpoints para criar grupos de produto, adicionais, produtos, mesas, usuarios, roles e permissoes.

## Possibilidade de usar agora
Sim, e possivel usar agora desde que o Postgres esteja disponivel e as variaveis de ambiente
estejam configuradas. Nao ha autenticacao obrigatoria, entao a API pode ser consumida diretamente.

Passos recomendados:
1) Subir Postgres local:
   - `docker-compose -f docker-compose-pg.yml up -d`
2) Definir variaveis de ambiente (necessarias no app):
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SYNC`
3) Aplicar migrations (Knex):
   - `npx knex --knexfile knexfile.js migrate:latest`
   - As migrations tambem criam seeds (admin e exemplo de produto).
4) Subir API:
   - `npm run start:dev` (ou `npm run start`)
5) Acessar Swagger:
   - `http://localhost:3000/api-docs`

Observacao: se `DB_SYNC=true`, o TypeORM tentara sincronizar as entidades, porem isso pode
conflitar com migrations (evite usar em producao).

## Modulos e funcionalidades

### Modulo App
Arquivos relevantes:
- `src/main.ts`
- `src/app.module.ts`

Funcionalidades:
- Inicializa o NestJS.
- Carrega `ConfigModule` global.
- Configura TypeORM para Postgres usando variaveis de ambiente.
- Configura Swagger (titulo "ERPFood API", versao "1.0-BETA") e publica em `/api-docs`.

Observacoes:
- Nao ha rota base implementada no `AppController`.
- Nao existe middleware global de validacao (ValidationPipe).

---

### Modulo User (Usuarios)
Arquivos relevantes:
- `src/user/user.controller.ts`
- `src/user/user.service.ts`
- `src/user/entities/user.entity.ts`
- `src/user/dto/*.ts`

Responsabilidade:
- CRUD basico de usuarios.

Endpoints:
- `POST /user` cria usuario
- `GET /user` lista usuarios
- `GET /user/:id` busca usuario por id
- `PATCH /user/:id` atualiza usuario
- `DELETE /user/:id` remove usuario

DTOs e payloads:
- CreateUserDto
  - `nome` (string, required)
  - `email` (string, required)
  - `senha` (string, required)
  - `roleId` (number, required)
- UpdateUserDto
  - todos os campos acima opcionais

Entidade `User`:
- `id` (pk)
- `nome` (varchar 100)
- `email` (varchar 100, unico)
- `senha` (varchar 100 na entidade; migration usa 255)
- `role` (relacao OneToOne com Role via `role_id`)
- `criadoEm`, `atualizadoEm` (timestamps)

Regras e comportamentos:
- `create` faz `repository.save(createUserDto)` sem tratar `roleId`.
  - Como `roleId` nao existe na entidade, ele nao e automaticamente associado ao usuario.
- `findAll` retorna todos usuarios.
- `findOne` retorna usuario por id ou `null`.
- `update` usa `repository.update` (nao retorna entidade atualizada).
- `remove` usa `repository.delete`.
- Nao ha hash de senha (senha e armazenada em texto puro).

Observacoes de modelagem:
- Em banco, `usuarios.role_id` permite varios usuarios para um mesmo role.
- Na entidade, a relacao esta como OneToOne; isso nao reflete o banco (deveria ser ManyToOne).

---

### Modulo Role (Roles)
Arquivos relevantes:
- `src/role/role.controller.ts`
- `src/role/role.service.ts`
- `src/role/entities/role.entity.ts`
- `src/role/dto/*.ts`

Responsabilidade:
- CRUD basico de roles.

Endpoints:
- `POST /role` cria role
- `GET /role` lista roles
- `GET /role/:id` busca role por id
- `PATCH /role/:id` atualiza role
- `DELETE /role/:id` remove role

DTOs e payloads:
- CreateRoleDto
  - `nome` (string, required)
  - `descricao` (string, required)
  - `permissionIds` (number[], opcional)
- UpdateRoleDto
  - todos os campos acima opcionais

Entidade `Role`:
- `id` (pk)
- `nome`
- `descricao`
- `criadoEm`, `atualizadoEm` (timestamps)
- `permissions` (ManyToMany com Permission via tabela `role_permissions`)

Regras e comportamentos:
- `create` salva apenas os campos do DTO. `permissionIds` nao e utilizado pelo service.
- Nao existe endpoint para vincular `permissions` a um role.
  - O vinculo precisa ser feito manualmente na tabela `role_permissions`.
- `update` usa `repository.update` (nao retorna entidade atualizada).

---

### Modulo Permission (Permissoes)
Arquivos relevantes:
- `src/permission/permission.controller.ts`
- `src/permission/permission.service.ts`
- `src/permission/entities/permission.entity.ts`
- `src/permission/dto/*.ts`

Responsabilidade:
- CRUD basico de permissoes.

Endpoints:
- `POST /permission` cria permissao
- `GET /permission` lista permissoes
- `GET /permission/:id` busca permissao por id
- `PATCH /permission/:id` atualiza permissao
- `DELETE /permission/:id` remove permissao

DTOs e payloads:
- CreatePermissionDto
  - `nome` (string, required)
  - `descricao` (string, required)
  - `roleIds` (number[], opcional)
- UpdatePermissionDto
  - todos os campos acima opcionais

Entidade `Permission`:
- `id` (pk)
- `nome`
- `descricao`
- `criadoEm`, `atualizadoEm` (timestamps)
- `roles` (ManyToMany com Role)

Regras e comportamentos:
- `create` salva apenas os campos do DTO. `roleIds` nao e utilizado pelo service.
- Nao existe endpoint para vincular `roles` a uma permissao.
  - O vinculo precisa ser feito manualmente na tabela `role_permissions`.
- `update` usa `repository.update`.

---

### Modulo ProductGroup (Grupos de Produto)
Arquivos relevantes:
- `src/product-group/product-group.controller.ts`
- `src/product-group/product-group.service.ts`
- `src/product-group/entities/product-group.entity.ts`
- `src/product-group/dto/*.ts`

Responsabilidade:
- CRUD de grupos de produto.

Endpoints:
- `POST /product-group` cria grupo
- `GET /product-group` lista grupos
- `GET /product-group/:id` busca grupo por id
- `PATCH /product-group/:id` atualiza grupo
- `DELETE /product-group/:id` remove grupo

DTOs e payloads:
- CreateProductGroupDto
  - `nome` (string, required)
  - `ativo` (boolean, required)
  - `ordem` (number, required)
- UpdateProductGroupDto
  - todos os campos acima opcionais

Entidade `ProductGroup`:
- `id` (pk)
- `nome` (varchar 100)
- `ativo` (boolean)
- `ordem` (int)
- `criadoEm`, `atualizadoEm` (timestamps)
- `products` (ManyToMany com Product)

Regras e comportamentos:
- Sem regras de negocio adicionais.
- `update` usa `repository.update`.

---

### Modulo Product (Produtos)
Arquivos relevantes:
- `src/product/product.controller.ts`
- `src/product/product.service.ts`
- `src/product/entities/product.entity.ts`
- `src/product/dto/*.ts`

Responsabilidade:
- CRUD parcial de produtos (nao ha delete).
- Relacionamento com grupos de produto e adicionais.

Endpoints:
- `POST /product` cria produto
- `GET /product` lista produtos
- `GET /product/:id` busca produto por id
- `PATCH /product/:id` atualiza produto

DTOs e payloads:
- CreateProductDto
  - `nome` (string, required)
  - `descricao` (string, required)
  - `preco` (string numerica, required)
  - `ativo` (boolean, required)
  - `imagemUrl` (string, required)
- `ordem` (number, opcional)
  - `grupoId` (number, opcional, legado)
  - `grupoIds` (number[], opcional)
  - `additionalIds` (number[], opcional)
- UpdateProductDto
  - todos os campos acima opcionais

Entidade `Product`:
- `id` (pk)
- `nome` (varchar 150)
- `descricao` (text)
- `preco` (decimal 10,2)
- `ativo` (boolean)
- `imagemUrl` (varchar 255)
- `ordem` (int, nullable)
- `grupos` (ManyToMany com ProductGroup via tabela `product_group_products`)
- `additionals` (ManyToMany com Additional via tabela `product_additionals`)
- `criadoEm`, `atualizadoEm` (timestamps)

Regras e comportamentos:
- `create` valida existencia de grupos (`grupoIds` e/ou `grupoId`):
  - precisa informar ao menos um grupo; se nao, retorna `BadRequestException` com mensagem "Informe ao menos um grupo.".
  - se algum grupo nao existir, retorna `BadRequestException` com mensagem "Algum grupo informado nao existe.".
- `create` vincula adicionais se `additionalIds` for informado.
  - nao ha validacao se algum `additionalId` nao existir (ids invalidos sao ignorados).
- `findAll` e `findOne` carregam `grupos` e `additionals` (relations).
- `update`:
  - busca produto com relations; se nao encontrar, retorna `null`.
  - se `grupoId` e/ou `grupoIds` for informado, valida existencia (mesma regra do create).
  - se `grupoIds` for `[]`, limpa todos os grupos.
  - se `additionalIds` for informado:
    - `[]` limpa todos os adicionais.
    - lista nao vazia vincula os adicionais encontrados.
  - salva a entidade atualizada.

Observacoes:
- Migration posterior torna `imagem_url` nullable, mas a entidade nao marca como `nullable`.

---

### Modulo Additional (Adicionais)
Arquivos relevantes:
- `src/additional/additional.controller.ts`
- `src/additional/additional.service.ts`
- `src/additional/entities/additional.entity.ts`
- `src/additional/dto/*.ts`

Responsabilidade:
- CRUD parcial de adicionais (nao ha delete).
- Relacionamento ManyToMany com produtos.

Endpoints:
- `POST /additional` cria adicional
- `GET /additional` lista adicionais
- `GET /additional/:id` busca adicional por id
- `PATCH /additional/:id` atualiza adicional

DTOs e payloads:
- CreateAdditionalDto
  - `nome` (string, required)
  - `quantidadeMax` (number, required)
  - `preco` (string numerica, required)
  - `ativo` (boolean, required)
  - `productIds` (number[], opcional)
- UpdateAdditionalDto
  - todos os campos acima opcionais

Entidade `Additional`:
- `id` (pk)
- `nome` (varchar 100)
- `quantidadeMax` (int)
- `preco` (decimal 10,2)
- `ativo` (boolean)
- `products` (ManyToMany com Product)
- `criadoEm`, `atualizadoEm` (timestamps)

Regras e comportamentos:
- `create`:
  - se `productIds` for informado, busca produtos e valida se todos existem.
  - se faltar algum, retorna `BadRequestException` com "Produtos informados nao existem.".
- `findAll` e `findOne` carregam `products` (relations).
- `update`:
  - busca adicional com relations; se nao encontrar, retorna `null`.
  - se `productIds` for informado:
    - `[]` limpa todos os produtos.
    - lista nao vazia valida existencia de todos, senao retorna erro.

---

### Modulo Mesa
Arquivos relevantes:
- `src/mesa/mesa.controller.ts`
- `src/mesa/mesa.service.ts`
- `src/mesa/entities/mesa.entity.ts`
- `src/mesa/dto/*.ts`

Responsabilidade:
- CRUD parcial de mesas (nao ha delete).

Endpoints:
- `POST /mesa` cria mesa
- `GET /mesa` lista mesas
- `GET /mesa/:id` busca mesa por id
- `PATCH /mesa/:id` atualiza mesa

DTOs e payloads:
- CreateMesaDto
  - `numero` (number, required)
  - `descricao` (string, required)
  - `setor` (string, required)
  - `ativo` (boolean, required)
- UpdateMesaDto
  - todos os campos acima opcionais

Entidade `Mesa`:
- `id` (pk)
- `numero` (int)
- `descricao` (text)
- `setor` (varchar 100)
- `ativo` (boolean)
- `criadoEm`, `atualizadoEm` (timestamps)

Regras e comportamentos:
- Sem regras de negocio adicionais.

---

## Migrations e seeds (Knex)
As migrations definem o schema do banco e incluem seeds basicas.

Lista e finalidade:
- `20260105020458_create_users.js`: tabela `usuarios`.
- `20260105020940_create_role_table.js`: tabela `roles`.
- `20260105020948_add_role_id_in_user.js`: adiciona `role_id` em `usuarios`.
- `20260105020957_create_permission_table.js`: tabela `permissions` (depois removida relacao direta).
- `20260105022100_create_role_permissions_table.js`: tabela de juncao `role_permissions`.
- `20260105023000_create_product_group_table.js`: tabela `product_groups`.
- `20260105024000_create_additionals_table.js`: tabela `additionals`.
- `20260105024010_create_products_table.js`: tabelas `products` e `product_additionals`.
- `20260105025000_create_mesas_table.js`: tabela `mesas`.
- `20260105030000_seed_admin_defaults.js`:
  - cria role Administradores (id 1)
  - cria permissao `all`
  - cria vinculo em `role_permissions`
  - cria usuario admin (email `admin@erpfood.com.br`, senha `admin`)
- `20260105032000_seed_example_product.js`:
  - altera `products.imagem_url` para nullable
  - cria grupo `Pizzas`
  - cria adicional `queijo`
  - cria produto `X-burguer`
  - vincula adicional ao produto
  - vincula produto ao grupo (via `product_group_products` quando a tabela existe)
- `20260129000000_create_product_group_products_table.js`:
  - cria tabela de juncao `product_group_products`
  - migra `products.product_group_id` para a tabela de juncao
  - remove a coluna `product_group_id`
- `20260129001000_add_indexes_product_group_products.js`:
  - adiciona indices em `product_group_products` para `product_group_id` e `product_id`

## Observacoes gerais e limites atuais
- Nao existe controle de acesso (roles/permissoes nao sao aplicados na API).
- Nao ha autenticacao (token, login, etc.).
- DTOs nao sao validados sem `ValidationPipe` global.
- Algumas relacoes declaradas no DTO nao sao persistidas automaticamente (roleId, permissionIds, roleIds).
- Nao ha endpoints de delete para product, additional e mesa.
