/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("mesas", (t) => {
    t.increments("id").primary();
    t.integer("numero").notNullable();
    t.text("descricao").notNullable();
    t.string("setor", 100).notNullable();
    t.boolean("ativo").notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("mesas");
};
