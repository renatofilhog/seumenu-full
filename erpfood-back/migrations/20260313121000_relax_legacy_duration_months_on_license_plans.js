/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasPlansTable = await trx.schema.hasTable('license_plans');
    if (!hasPlansTable) {
      return;
    }

    const hasDurationMonths = await trx.schema.hasColumn('license_plans', 'duration_months');
    if (!hasDurationMonths) {
      return;
    }

    const hasDefaultDurationDays = await trx.schema.hasColumn('license_plans', 'default_duration_days');
    if (hasDefaultDurationDays) {
      await trx.raw(`
        UPDATE license_plans
        SET duration_months = COALESCE(duration_months, GREATEST(1, CEIL(default_duration_days / 30.0)))
      `);
    }

    await trx.raw('ALTER TABLE license_plans ALTER COLUMN duration_months DROP NOT NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function () {
  // No-op. Reinstating NOT NULL on a legacy compatibility column is not safe in rollback.
};
