/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const permission = {
    nome: 'pedido.status.update',
    descricao: 'Gerado automaticamente - pedido.status.update',
  };

  await knex.transaction(async (trx) => {
    const existing = await trx('permissions').where({ nome: permission.nome }).first();
    if (!existing) {
      await trx('permissions').insert(permission);
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.transaction(async (trx) => {
    await trx('permissions').where({ nome: 'pedido.status.update' }).del();
  });
};
