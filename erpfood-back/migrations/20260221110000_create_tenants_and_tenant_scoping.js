/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasTenants = await trx.schema.hasTable('tenants');
    if (!hasTenants) {
      await trx.schema.createTable('tenants', (t) => {
        t.increments('id').primary();
        t.string('nome', 150).notNullable();
        t.string('slug', 120).notNullable().unique();
        t.string('dominio', 255).nullable().unique();
        t.string('subdominio', 100).nullable().unique();
        t.boolean('ativo').notNullable().defaultTo(true);
        t.timestamps(true, true);
      });
    }

    const hasTenantUsers = await trx.schema.hasTable('tenant_users');
    if (!hasTenantUsers) {
      await trx.schema.createTable('tenant_users', (t) => {
        t.increments('id').primary();
        t.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.integer('user_id').unsigned().notNullable().references('id').inTable('usuarios').onDelete('CASCADE');
        t.integer('role_id').unsigned().nullable().references('id').inTable('roles').onDelete('SET NULL');
        t.boolean('ativo').notNullable().defaultTo(true);
        t.timestamps(true, true);
        t.unique(['tenant_id', 'user_id'], { indexName: 'uq_tenant_users_tenant_user' });
        t.index(['tenant_id'], 'idx_tenant_users_tenant_id');
        t.index(['user_id'], 'idx_tenant_users_user_id');
      });
    }

    const existingDefaultTenant = await trx('tenants').where({ slug: 'default' }).first();
    let defaultTenantId = existingDefaultTenant?.id;

    if (!defaultTenantId) {
      const inserted = await trx('tenants')
        .insert({
          nome: 'Default Tenant',
          slug: 'default',
          dominio: 'localhost',
          subdominio: 'default',
          ativo: true,
        })
        .returning('id');

      defaultTenantId = Array.isArray(inserted) ? (typeof inserted[0] === 'object' ? inserted[0].id : inserted[0]) : inserted;
    }

    const addTenantIdColumnIfMissing = async (tableName) => {
      const hasColumn = await trx.schema.hasColumn(tableName, 'tenant_id');
      if (!hasColumn) {
        await trx.schema.alterTable(tableName, (t) => {
          t.integer('tenant_id').unsigned().nullable().references('id').inTable('tenants').onDelete('RESTRICT');
          t.index(['tenant_id'], `idx_${tableName}_tenant_id`);
        });
      }
    };

    const scopedTables = [
      'usuarios',
      'roles',
      'product_groups',
      'additionals',
      'products',
      'mesas',
      'pedidos',
      'pedido_itens',
      'lojas',
      'product_group_products',
      'product_additionals',
    ];

    for (const tableName of scopedTables) {
      await addTenantIdColumnIfMissing(tableName);
      await trx(tableName).whereNull('tenant_id').update({ tenant_id: defaultTenantId });
    }

    const users = await trx('usuarios').select('id', 'role_id');
    for (const user of users) {
      await trx('tenant_users')
        .insert({
          tenant_id: defaultTenantId,
          user_id: user.id,
          role_id: user.role_id ?? null,
          ativo: true,
        })
        .onConflict(['tenant_id', 'user_id'])
        .ignore();
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    const scopedTables = [
      'product_additionals',
      'product_group_products',
      'lojas',
      'pedido_itens',
      'pedidos',
      'mesas',
      'products',
      'additionals',
      'product_groups',
      'roles',
      'usuarios',
    ];

    for (const tableName of scopedTables) {
      const hasColumn = await trx.schema.hasColumn(tableName, 'tenant_id');
      if (hasColumn) {
        await trx.schema.alterTable(tableName, (t) => {
          t.dropColumn('tenant_id');
        });
      }
    }

    const hasTenantUsers = await trx.schema.hasTable('tenant_users');
    if (hasTenantUsers) {
      await trx.schema.dropTable('tenant_users');
    }

    const hasTenants = await trx.schema.hasTable('tenants');
    if (hasTenants) {
      await trx.schema.dropTable('tenants');
    }
  });
};
