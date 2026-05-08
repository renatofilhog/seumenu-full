/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('pedidos', (t) => {
    t.string('nome_cliente', 150).nullable();
    t.string('telefone_cliente', 30).nullable();
    t.string('forma_pagamento', 30).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('pedidos', (t) => {
    t.dropColumn('forma_pagamento');
    t.dropColumn('telefone_cliente');
    t.dropColumn('nome_cliente');
  });
};
