/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.table('lojas', (t) => {
    t.boolean('habilita_verificacao_mesa').notNullable().defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('lojas', (t) => {
    t.dropColumn('habilita_verificacao_mesa');
  });
};
