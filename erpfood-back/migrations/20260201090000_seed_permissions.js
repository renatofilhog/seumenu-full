/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const permissions = [
    { nome: 'user.create', descricao: 'Gerado automaticamente - user.create' },
    { nome: 'user.read', descricao: 'Gerado automaticamente - user.read' },
    { nome: 'user.update', descricao: 'Gerado automaticamente - user.update' },
    { nome: 'user.delete', descricao: 'Gerado automaticamente - user.delete' },
    { nome: 'role.create', descricao: 'Gerado automaticamente - role.create' },
    { nome: 'role.read', descricao: 'Gerado automaticamente - role.read' },
    { nome: 'role.update', descricao: 'Gerado automaticamente - role.update' },
    { nome: 'role.delete', descricao: 'Gerado automaticamente - role.delete' },
    { nome: 'permission.create', descricao: 'Gerado automaticamente - permission.create' },
    { nome: 'permission.read', descricao: 'Gerado automaticamente - permission.read' },
    { nome: 'permission.update', descricao: 'Gerado automaticamente - permission.update' },
    { nome: 'permission.delete', descricao: 'Gerado automaticamente - permission.delete' },
    { nome: 'product-group.create', descricao: 'Gerado automaticamente - product-group.create' },
    { nome: 'product-group.read', descricao: 'Gerado automaticamente - product-group.read' },
    { nome: 'product-group.update', descricao: 'Gerado automaticamente - product-group.update' },
    { nome: 'product-group.delete', descricao: 'Gerado automaticamente - product-group.delete' },
    { nome: 'product.create', descricao: 'Gerado automaticamente - product.create' },
    { nome: 'product.read', descricao: 'Gerado automaticamente - product.read' },
    { nome: 'product.update', descricao: 'Gerado automaticamente - product.update' },
    { nome: 'additional.create', descricao: 'Gerado automaticamente - additional.create' },
    { nome: 'additional.read', descricao: 'Gerado automaticamente - additional.read' },
    { nome: 'additional.update', descricao: 'Gerado automaticamente - additional.update' },
    { nome: 'mesa.create', descricao: 'Gerado automaticamente - mesa.create' },
    { nome: 'mesa.read', descricao: 'Gerado automaticamente - mesa.read' },
    { nome: 'mesa.update', descricao: 'Gerado automaticamente - mesa.update' },
    { nome: 'pedido.create', descricao: 'Gerado automaticamente - pedido.create' },
    { nome: 'pedido.read', descricao: 'Gerado automaticamente - pedido.read' },
    { nome: 'pedido.update', descricao: 'Gerado automaticamente - pedido.update' },
    { nome: 'pedido-item.read', descricao: 'Gerado automaticamente - pedido-item.read' },
    { nome: 'pedido-item.update', descricao: 'Gerado automaticamente - pedido-item.update' },
    { nome: 'pedido-status.read', descricao: 'Gerado automaticamente - pedido-status.read' },
    { nome: 'pedido-status.update', descricao: 'Gerado automaticamente - pedido-status.update' },
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
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'role.create',
    'role.read',
    'role.update',
    'role.delete',
    'permission.create',
    'permission.read',
    'permission.update',
    'permission.delete',
    'product-group.create',
    'product-group.read',
    'product-group.update',
    'product-group.delete',
    'product.create',
    'product.read',
    'product.update',
    'additional.create',
    'additional.read',
    'additional.update',
    'mesa.create',
    'mesa.read',
    'mesa.update',
    'pedido.create',
    'pedido.read',
    'pedido.update',
    'pedido-item.read',
    'pedido-item.update',
    'pedido-status.read',
    'pedido-status.update',
  ];

  await knex.transaction(async (trx) => {
    await trx('permissions').whereIn('nome', permissionNames).del();
  });
};
