/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("additionals", (t) => {
    t.increments("id").primary();
    t.string("nome", 100).notNullable();
    t.integer("quantidade_max").notNullable();
    t.decimal("preco", 10, 2).notNullable();
    t.boolean("ativo").notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("additionals");
};
