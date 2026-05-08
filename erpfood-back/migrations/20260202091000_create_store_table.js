/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('lojas', (t) => {
    t.increments('id').primary();
    t.string('nome', 150).notNullable();
    t.string('cnpj', 20).nullable();
    t.text('resumo').notNullable();
    t.string('banner_url', 255).notNullable();
    t.string('logo_url', 255).notNullable();
    t.string('horario_funcionamento', 255).notNullable();
    t.string('localizacao', 255).notNullable();
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable('lojas');
};
