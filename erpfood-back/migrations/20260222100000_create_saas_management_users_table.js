const { randomBytes, scryptSync } = require('crypto');

function hashPassword(value) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(value, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasTable = await trx.schema.hasTable('saas_management_users');
    if (!hasTable) {
      await trx.schema.createTable('saas_management_users', (t) => {
        t.increments('id').primary();
        t.string('nome', 100).notNullable();
        t.string('email', 100).notNullable().unique();
        t.string('senha', 255).notNullable();
        t.boolean('ativo').notNullable().defaultTo(true);
        t.timestamps(true, true);
      });
    }

    const defaultUserEmail = 'admin@saas.seumenu.com.br';
    const existing = await trx('saas_management_users').where({ email: defaultUserEmail }).first();
    if (!existing) {
      await trx('saas_management_users').insert({
        nome: 'saas-admin',
        email: defaultUserEmail,
        senha: hashPassword('admin'),
        ativo: true,
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
    await trx('saas_management_users').where({ email: 'admin@saas.seumenu.com.br' }).del();
    await trx.schema.dropTableIfExists('saas_management_users');
  });
};
