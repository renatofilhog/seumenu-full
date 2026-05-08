/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const permissions = [
    { nome: 'store.create', descricao: 'Gerado automaticamente - store.create' },
    { nome: 'store.read', descricao: 'Gerado automaticamente - store.read' },
    { nome: 'store.update', descricao: 'Gerado automaticamente - store.update' },
    { nome: 'store.delete', descricao: 'Gerado automaticamente - store.delete' },
  ];

  await knex.transaction(async (trx) => {
    for (const permission of permissions) {
      const existing = await trx('permissions')
        .where({ nome: permission.nome })
        .first();
      if (!existing) {
        await trx('permissions').insert(permission);
      }
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const permissionNames = [
    'store.create',
    'store.read',
    'store.update',
    'store.delete',
  ];

  await knex.transaction(async (trx) => {
    await trx('permissions').whereIn('nome', permissionNames).del();
  });
};
