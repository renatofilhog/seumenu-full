/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasRoles = await trx.schema.hasTable('roles');
    if (!hasRoles) {
      return;
    }

    const hasNome = await trx.schema.hasColumn('roles', 'nome');
    if (hasNome) {
      await trx.raw('ALTER TABLE roles ALTER COLUMN nome TYPE varchar(255)');
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasRoles = await trx.schema.hasTable('roles');
    if (!hasRoles) {
      return;
    }

    const hasNome = await trx.schema.hasColumn('roles', 'nome');
    if (hasNome) {
      await trx.raw('ALTER TABLE roles ALTER COLUMN nome TYPE varchar(50)');
    }
  });
};
