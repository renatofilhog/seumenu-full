/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasUsuarios = await trx.schema.hasTable('usuarios');
    if (!hasUsuarios) {
      return;
    }

    const hasForcePasswordChange = await trx.schema.hasColumn('usuarios', 'force_password_change');
    if (!hasForcePasswordChange) {
      await trx.schema.alterTable('usuarios', (t) => {
        t.boolean('force_password_change').notNullable().defaultTo(false);
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
    const hasUsuarios = await trx.schema.hasTable('usuarios');
    if (!hasUsuarios) {
      return;
    }

    const hasForcePasswordChange = await trx.schema.hasColumn('usuarios', 'force_password_change');
    if (hasForcePasswordChange) {
      await trx.schema.alterTable('usuarios', (t) => {
        t.dropColumn('force_password_change');
      });
    }
  });
};
