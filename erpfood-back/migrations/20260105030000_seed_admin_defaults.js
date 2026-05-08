const { randomBytes, scryptSync } = require('crypto');

function hashPassword(value) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(value, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.transaction(async (trx) => {
    const roleId = 1;
    const permissionName = 'all';
    const roleName = 'Administradores';

    const role = await trx('roles').where({ id: roleId }).first();
    if (!role) {
      await trx('roles').insert({
        id: roleId,
        nome: roleName,
        descricao: 'Gerado automaticamente, role Administradores',
      });
    }

    let permission = await trx('permissions').where({ nome: permissionName }).first();
    if (!permission) {
      const inserted = await trx('permissions')
        .insert({
          nome: permissionName,
          descricao: 'Gerado automaticamente - Todas as permissoes',
        })
        .returning('id');
      const permissionId = Array.isArray(inserted) ? inserted[0].id ?? inserted[0] : inserted.id ?? inserted;
      permission = await trx('permissions').where({ id: permissionId }).first();
    }

    const rolePermission = await trx('role_permissions')
      .where({ role_id: roleId, permission_id: permission.id })
      .first();
    if (!rolePermission) {
      await trx('role_permissions').insert({
        role_id: roleId,
        permission_id: permission.id,
      });
    }

    const adminUser = await trx('usuarios').where({ email: 'admin@erpfood.com.br' }).first();
    if (!adminUser) {
      await trx('usuarios').insert({
        nome: 'admin',
        email: 'admin@erpfood.com.br',
        senha: hashPassword('admin'),
        role_id: roleId,
      });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.transaction(async (trx) => {
    const permission = await trx('permissions').where({ nome: 'all' }).first();
    if (permission) {
      await trx('role_permissions')
        .where({ role_id: 1, permission_id: permission.id })
        .del();
      await trx('permissions').where({ id: permission.id }).del();
    }

    await trx('usuarios').where({ email: 'admin@erpfood.com.br' }).del();
    await trx('roles').where({ id: 1, nome: 'Administradores' }).del();
  });
};
