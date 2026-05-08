/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasLojas = await trx.schema.hasTable('lojas');
    if (!hasLojas) {
      return;
    }

    const hasTenantId = await trx.schema.hasColumn('lojas', 'tenant_id');
    if (!hasTenantId) {
      await trx.schema.alterTable('lojas', (t) => {
        t.integer('tenant_id').unsigned().nullable().references('id').inTable('tenants').onDelete('SET NULL');
      });
    }

    const hasAtivo = await trx.schema.hasColumn('lojas', 'ativo');
    if (!hasAtivo) {
      await trx.schema.alterTable('lojas', (t) => {
        t.boolean('ativo').notNullable().defaultTo(true);
      });
    }

    const duplicateTenantRows = await trx('lojas')
      .select('tenant_id')
      .whereNotNull('tenant_id')
      .groupBy('tenant_id')
      .havingRaw('COUNT(*) > 1');

    for (const row of duplicateTenantRows) {
      const tenantId = row.tenant_id;
      const stores = await trx('lojas')
        .select('id')
        .where({ tenant_id: tenantId })
        .orderBy('updated_at', 'desc')
        .orderBy('id', 'desc');

      const keep = stores[0];
      const archiveIds = stores.slice(1).map((store) => store.id);

      if (!keep || archiveIds.length === 0) {
        continue;
      }

      await trx('lojas')
        .whereIn('id', archiveIds)
        .update({
          ativo: false,
          tenant_id: null,
        });
    }

    await trx.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'uq_lojas_tenant_id'
        ) THEN
          ALTER TABLE lojas ADD CONSTRAINT uq_lojas_tenant_id UNIQUE (tenant_id);
        END IF;
      END
      $$;
    `);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasLojas = await trx.schema.hasTable('lojas');
    if (!hasLojas) {
      return;
    }

    await trx.raw(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'uq_lojas_tenant_id'
        ) THEN
          ALTER TABLE lojas DROP CONSTRAINT uq_lojas_tenant_id;
        END IF;
      END
      $$;
    `);

    const hasAtivo = await trx.schema.hasColumn('lojas', 'ativo');
    if (hasAtivo) {
      await trx.schema.alterTable('lojas', (t) => {
        t.dropColumn('ativo');
      });
    }
  });
};
