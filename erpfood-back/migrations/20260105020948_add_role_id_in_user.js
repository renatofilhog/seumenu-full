/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable("usuarios", (t) => {
    t.integer("role_id").unsigned().references("id").inTable("roles");
  }); 
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable("usuarios", (t) => {
    t.dropColumn("role_id");
  });
};
