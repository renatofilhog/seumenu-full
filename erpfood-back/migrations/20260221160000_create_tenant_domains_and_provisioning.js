/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasTenantDomains = await trx.schema.hasTable('tenant_domains');
    if (!hasTenantDomains) {
      await trx.schema.createTable('tenant_domains', (t) => {
        t.increments('id').primary();
        t.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('domain', 255).nullable().unique();
        t.string('subdomain', 100).nullable().unique();
        t.boolean('is_primary').notNullable().defaultTo(true);
        t.timestamps(true, true);
        t.index(['tenant_id'], 'idx_tenant_domains_tenant_id');
      });
    }

    const tenants = await trx('tenants').select('id', 'dominio', 'subdominio');
    for (const tenant of tenants) {
      const hasDomain = await trx('tenant_domains')
        .where({ tenant_id: tenant.id, domain: tenant.dominio ?? null, subdomain: tenant.subdominio ?? null })
        .first();

      if (!hasDomain) {
        await trx('tenant_domains').insert({
          tenant_id: tenant.id,
          domain: tenant.dominio ?? null,
          subdomain: tenant.subdominio ?? null,
          is_primary: true,
        });
      }
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('tenant_domains');
};
