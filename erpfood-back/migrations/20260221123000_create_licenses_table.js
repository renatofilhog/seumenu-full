/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasTable = await trx.schema.hasTable('licenses');
    if (!hasTable) {
      await trx.schema.createTable('licenses', (t) => {
        t.increments('id').primary();
        t.integer('tenant_id').unsigned().notNullable().references('id').inTable('tenants').onDelete('CASCADE');
        t.string('plan_type', 50).notNullable().defaultTo('basic');
        t.string('status', 20).notNullable().defaultTo('active');
        t.timestamp('starts_at').notNullable().defaultTo(trx.fn.now());
        t.timestamp('expires_at').notNullable();
        t.timestamp('grace_until').nullable();
        t.timestamp('last_checked_at').nullable();
        t.timestamps(true, true);
        t.index(['tenant_id'], 'idx_licenses_tenant_id');
        t.index(['status'], 'idx_licenses_status');
        t.index(['expires_at'], 'idx_licenses_expires_at');
      });
    }

    const defaultTenant = await trx('tenants').where({ slug: 'default' }).first();
    if (defaultTenant) {
      const hasLicense = await trx('licenses')
        .where({ tenant_id: defaultTenant.id })
        .first();

      if (!hasLicense) {
        await trx('licenses').insert({
          tenant_id: defaultTenant.id,
          plan_type: 'basic',
          status: 'active',
          starts_at: trx.fn.now(),
          expires_at: trx.raw("CURRENT_TIMESTAMP + interval '365 days'"),
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
  await knex.schema.dropTableIfExists('licenses');
};
