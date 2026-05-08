/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("product_groups", (t) => {
    t.increments("id").primary();
    t.string("nome", 100).notNullable();
    t.boolean("ativo").notNullable().defaultTo(true);
    t.integer("ordem").notNullable();
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("product_groups");
};
