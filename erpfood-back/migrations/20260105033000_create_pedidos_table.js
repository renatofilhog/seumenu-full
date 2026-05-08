/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("pedidos", (t) => {
    t.increments("id").primary();
    t.integer("numero").notNullable().unique();
    t.decimal("valor_liq", 10, 2).notNullable();
    t.decimal("valor_desc", 10, 2).notNullable().defaultTo(0);
    t.decimal("valor_total", 10, 2).notNullable();
    t.timestamp("data").notNullable();
    t.string("status", 20).notNullable().defaultTo('em_analise');
    t.string("cod_cupom", 50);
    t.integer("mesa_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("mesas")
      .onDelete('RESTRICT');
    t.timestamps(true, true);
  });

  await knex.schema.createTable("pedido_itens", (t) => {
    t.increments("id").primary();
    t.integer("pedido_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("pedidos")
      .onDelete('CASCADE');
    t.integer("product_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("products")
      .onDelete('RESTRICT');
    t.decimal("valor_unit", 10, 2).notNullable();
    t.integer("qt_solicitada").notNullable();
    t.decimal("vl_desconto", 10, 2).notNullable().defaultTo(0);
    t.decimal("vl_total", 10, 2).notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable("pedido_item_additionals", (t) => {
    t.integer("pedido_item_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("pedido_itens")
      .onDelete('CASCADE');
    t.integer("additional_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("additionals")
      .onDelete('CASCADE');
    t.primary(["pedido_item_id", "additional_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable("pedido_item_additionals");
  await knex.schema.dropTable("pedido_itens");
  await knex.schema.dropTable("pedidos");
};
