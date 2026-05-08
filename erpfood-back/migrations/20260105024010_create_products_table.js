/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("products", (t) => {
    t.increments("id").primary();
    t.string("nome", 150).notNullable();
    t.text("descricao").notNullable();
    t.decimal("preco", 10, 2).notNullable();
    t.boolean("ativo").notNullable().defaultTo(true);
    t.string("imagem_url", 255).notNullable();
    t.integer("ordem");
    t.integer("product_group_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("product_groups")
      .onDelete('CASCADE');
    t.timestamps(true, true);
  });

  await knex.schema.createTable("product_additionals", (t) => {
    t.integer("product_id").unsigned().notNullable().references("id").inTable("products").onDelete('CASCADE');
    t.integer("additional_id").unsigned().notNullable().references("id").inTable("additionals").onDelete('CASCADE');
    t.primary(["product_id", "additional_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("product_additionals");
  await knex.schema.dropTable("products");
};
