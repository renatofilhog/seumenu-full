/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("permissions", (t) => {
    t.increments("id").primary();
    t.integer("role_id").unsigned().references("id").inTable("roles").onDelete('CASCADE');
    t.string("nome", 100).notNullable().unique();
    t.string("descricao", 255);
    t.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("permissions");
};
