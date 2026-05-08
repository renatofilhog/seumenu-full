/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("role_permissions", (t) => {
    t.integer("role_id").unsigned().notNullable().references("id").inTable("roles").onDelete('CASCADE');
    t.integer("permission_id").unsigned().notNullable().references("id").inTable("permissions").onDelete('CASCADE');
    t.primary(["role_id", "permission_id"]);
  });

  await knex.schema.table("permissions", (t) => {
    t.dropColumn("role_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("role_permissions");

  await knex.schema.table("permissions", (t) => {
    t.integer("role_id").unsigned().references("id").inTable("roles").onDelete('CASCADE');
  });
};
