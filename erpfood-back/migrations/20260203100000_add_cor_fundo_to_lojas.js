/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.table('lojas', (t) => {
    t.string('cor_fundo', 20).notNullable().defaultTo('#ffffff');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('lojas', (t) => {
    t.dropColumn('cor_fundo');
  });
};
