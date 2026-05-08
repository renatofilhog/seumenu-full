/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const exists = await knex('pedido_status')
    .where({ value: 'cancelado' })
    .first();

  if (!exists) {
    await knex('pedido_status').insert({
      value: 'cancelado',
      label: 'Cancelado',
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const emAnalise = await knex('pedido_status')
    .where({ value: 'em_analise' })
    .first(['id']);
  const cancelado = await knex('pedido_status')
    .where({ value: 'cancelado' })
    .first(['id']);

  if (!cancelado) {
    return;
  }

  if (emAnalise) {
    await knex('pedidos')
      .where({ status_id: cancelado.id })
      .update({ status_id: emAnalise.id });
  }

  await knex('pedido_status')
    .where({ id: cancelado.id })
    .del();
};
