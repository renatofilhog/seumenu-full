/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("usuarios", (t) => {
    t.increments("id").primary();
    t.string("nome", 100).notNullable();
    t.string("email", 100).notNullable().unique();
    t.string("senha", 255).notNullable();
    t.timestamps(true, true);
  });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("usuarios");
};
