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
        t.string('type', 50).notNullable().defaultTo('subscription');
        t.integer('default_duration_days').notNullable();
        t.boolean('ativo').notNullable().defaultTo(true);
        t.timestamps(true, true);
      });
    } else {
      const hasType = await trx.schema.hasColumn('license_plans', 'type');
      if (!hasType) {
        await trx.schema.alterTable('license_plans', (t) => {
          t.string('type', 50).notNullable().defaultTo('subscription');
        });
      }

      const hasDefaultDurationDays = await trx.schema.hasColumn('license_plans', 'default_duration_days');
      if (!hasDefaultDurationDays) {
        await trx.schema.alterTable('license_plans', (t) => {
          t.integer('default_duration_days').nullable();
        });
      }

      const hasDurationMonths = await trx.schema.hasColumn('license_plans', 'duration_months');
      if (hasDurationMonths) {
        await trx.raw('UPDATE license_plans SET default_duration_days = COALESCE(default_duration_days, duration_months * 30)');
      }

      await trx.raw('UPDATE license_plans SET default_duration_days = COALESCE(default_duration_days, 30)');

      await trx.schema.alterTable('license_plans', (t) => {
        t.integer('default_duration_days').notNullable().alter();
      });
    }

    const seedPlans = [
      { code: 'mensal', nome: 'Mensal', type: 'subscription', default_duration_days: 30, ativo: true },
      { code: 'trimestral', nome: 'Trimestral', type: 'subscription', default_duration_days: 90, ativo: true },
      { code: 'semestral', nome: 'Semestral', type: 'subscription', default_duration_days: 180, ativo: true },
      { code: 'anual', nome: 'Anual', type: 'subscription', default_duration_days: 365, ativo: true },
    ];

    for (const plan of seedPlans) {
      const existing = await trx('license_plans').where({ code: plan.code }).first();
      if (!existing) {
        await trx('license_plans').insert(plan);
      } else {
        await trx('license_plans').where({ id: existing.id }).update(plan);
      }
    }

    const hasUsuariosTable = await trx.schema.hasTable('usuarios');
    const hasUsersTable = hasUsuariosTable ? false : await trx.schema.hasTable('users');
    const userTableName = hasUsuariosTable ? 'usuarios' : hasUsersTable ? 'users' : null;

    const hasRenewalHistory = await trx.schema.hasTable('license_renewal_history');
    if (!hasRenewalHistory) {
      await trx.schema.createTable('license_renewal_history', (t) => {
        t.increments('id').primary();
        t.integer('tenant_license_id').unsigned().notNullable().references('id').inTable('licenses').onDelete('CASCADE');
        t.integer('added_days').notNullable();
        t.timestamp('previous_end_date').notNullable();
        t.timestamp('new_end_date').notNullable();
        const renewedByUserIdColumn = t.integer('renewed_by_user_id').unsigned().nullable();
        if (userTableName) {
          renewedByUserIdColumn.references('id').inTable(userTableName).onDelete('SET NULL');
        }
        t.timestamp('renewed_at').notNullable().defaultTo(trx.fn.now());
        t.index(['tenant_license_id'], 'idx_license_renewal_history_license_id');
      });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    await trx.schema.dropTableIfExists('license_renewal_history');

    const hasDefaultDurationDays = await trx.schema.hasColumn('license_plans', 'default_duration_days');
    if (hasDefaultDurationDays) {
      await trx.schema.alterTable('license_plans', (t) => {
        t.dropColumn('default_duration_days');
      });
    }

    const hasType = await trx.schema.hasColumn('license_plans', 'type');
    if (hasType) {
      await trx.schema.alterTable('license_plans', (t) => {
        t.dropColumn('type');
      });
    }
  });
};
