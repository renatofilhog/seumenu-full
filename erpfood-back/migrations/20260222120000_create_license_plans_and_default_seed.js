/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasPlansTable = await trx.schema.hasTable('license_plans');
    if (!hasPlansTable) {
      await trx.schema.createTable('license_plans', (t) => {
        t.increments('id').primary();
        t.string('code', 100).notNullable().unique();
        t.string('nome', 120).notNullable();
        t.integer('duration_months').notNullable();
        t.boolean('ativo').notNullable().defaultTo(true);
        t.timestamps(true, true);
      });
    }

    const hasPlanId = await trx.schema.hasColumn('licenses', 'plan_id');
    if (!hasPlanId) {
      await trx.schema.alterTable('licenses', (t) => {
        t.integer('plan_id').unsigned().nullable().references('id').inTable('license_plans').onDelete('SET NULL');
        t.index(['plan_id'], 'idx_licenses_plan_id');
      });
    }

    const plans = [
      { code: 'mensal', nome: 'Mensal', duration_months: 1, ativo: true },
      { code: 'trimestral', nome: 'Trimestral', duration_months: 3, ativo: true },
      { code: 'semestral', nome: 'Semestral', duration_months: 6, ativo: true },
      { code: 'anual', nome: 'Anual', duration_months: 12, ativo: true },
    ];

    for (const plan of plans) {
      const existing = await trx('license_plans').where({ code: plan.code }).first();
      if (!existing) {
        await trx('license_plans').insert(plan);
      } else {
        await trx('license_plans')
          .where({ id: existing.id })
          .update({
            nome: plan.nome,
            duration_months: plan.duration_months,
            ativo: plan.ativo,
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
  await knex.transaction(async (trx) => {
    const hasPlanId = await trx.schema.hasColumn('licenses', 'plan_id');
    if (hasPlanId) {
      await trx.schema.alterTable('licenses', (t) => {
        t.dropColumn('plan_id');
      });
    }
    await trx.schema.dropTableIfExists('license_plans');
  });
};
