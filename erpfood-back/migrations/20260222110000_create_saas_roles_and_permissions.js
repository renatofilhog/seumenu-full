/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasPermissions = await trx.schema.hasTable('saas_permissions');
    if (!hasPermissions) {
      await trx.schema.createTable('saas_permissions', (t) => {
        t.increments('id').primary();
        t.string('nome', 120).notNullable().unique();
        t.string('descricao', 255).nullable();
        t.timestamps(true, true);
      });
    }

    const hasRoles = await trx.schema.hasTable('saas_roles');
    if (!hasRoles) {
      await trx.schema.createTable('saas_roles', (t) => {
        t.increments('id').primary();
        t.string('nome', 120).notNullable().unique();
        t.string('descricao', 255).nullable();
        t.timestamps(true, true);
      });
    }

    const hasRolePermissions = await trx.schema.hasTable('saas_role_permissions');
    if (!hasRolePermissions) {
      await trx.schema.createTable('saas_role_permissions', (t) => {
        t.increments('id').primary();
        t.integer('role_id').unsigned().notNullable().references('id').inTable('saas_roles').onDelete('CASCADE');
        t.integer('permission_id').unsigned().notNullable().references('id').inTable('saas_permissions').onDelete('CASCADE');
        t.unique(['role_id', 'permission_id']);
        t.index(['role_id'], 'idx_saas_role_permissions_role_id');
        t.index(['permission_id'], 'idx_saas_role_permissions_permission_id');
      });
    }

    const hasRoleIdColumn = await trx.schema.hasColumn('saas_management_users', 'role_id');
    if (!hasRoleIdColumn) {
      await trx.schema.alterTable('saas_management_users', (t) => {
        t.integer('role_id').unsigned().nullable().references('id').inTable('saas_roles').onDelete('SET NULL');
        t.index(['role_id'], 'idx_saas_management_users_role_id');
      });
    }

    const permissionsSeed = [
      { nome: 'saas.manage', descricao: 'Acesso completo de gerenciamento SAAS' },
      { nome: 'saas.tenants.read', descricao: 'Leitura de tenants SAAS' },
      { nome: 'saas.tenants.write', descricao: 'Escrita de tenants SAAS' },
      { nome: 'saas.licenses.read', descricao: 'Leitura de licencas SAAS' },
      { nome: 'saas.licenses.write', descricao: 'Escrita de licencas SAAS' },
      { nome: 'saas.users.read', descricao: 'Leitura de usuarios SAAS' },
      { nome: 'saas.users.write', descricao: 'Escrita de usuarios SAAS' },
      { nome: 'saas.provisioning.execute', descricao: 'Execucao de provisionamento SAAS' },
    ];

    for (const permission of permissionsSeed) {
      const existingPermission = await trx('saas_permissions').where({ nome: permission.nome }).first();
      if (!existingPermission) {
        await trx('saas_permissions').insert(permission);
      }
    }

    const rolesSeed = [
      { nome: 'saas_super_admin', descricao: 'Acesso total ao gerenciamento SAAS' },
      { nome: 'saas_operator', descricao: 'Operacao SAAS sem alteracoes destrutivas' },
    ];

    for (const role of rolesSeed) {
      const existingRole = await trx('saas_roles').where({ nome: role.nome }).first();
      if (!existingRole) {
        await trx('saas_roles').insert(role);
      }
    }

    const superAdminRole = await trx('saas_roles').where({ nome: 'saas_super_admin' }).first();
    const operatorRole = await trx('saas_roles').where({ nome: 'saas_operator' }).first();

    const allPermissions = await trx('saas_permissions').select('id', 'nome');
    if (superAdminRole) {
      for (const permission of allPermissions) {
        const existingLink = await trx('saas_role_permissions')
          .where({ role_id: superAdminRole.id, permission_id: permission.id })
          .first();
        if (!existingLink) {
          await trx('saas_role_permissions').insert({
            role_id: superAdminRole.id,
            permission_id: permission.id,
          });
        }
      }
    }

    const operatorPermissionNames = [
      'saas.tenants.read',
      'saas.licenses.read',
      'saas.users.read',
      'saas.provisioning.execute',
    ];

    if (operatorRole) {
      for (const permissionName of operatorPermissionNames) {
        const permission = allPermissions.find((p) => p.nome === permissionName);
        if (!permission) {
          continue;
        }
        const existingLink = await trx('saas_role_permissions')
          .where({ role_id: operatorRole.id, permission_id: permission.id })
          .first();
        if (!existingLink) {
          await trx('saas_role_permissions').insert({
            role_id: operatorRole.id,
            permission_id: permission.id,
          });
        }
      }
    }

    const defaultUserEmail = 'admin@saas.seumenu.com.br';
    const defaultUser = await trx('saas_management_users').where({ email: defaultUserEmail }).first();
    if (defaultUser && superAdminRole) {
      await trx('saas_management_users')
        .where({ id: defaultUser.id })
        .update({ role_id: superAdminRole.id });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasRoleIdColumn = await trx.schema.hasColumn('saas_management_users', 'role_id');
    if (hasRoleIdColumn) {
      await trx.schema.alterTable('saas_management_users', (t) => {
        t.dropColumn('role_id');
      });
    }

    await trx.schema.dropTableIfExists('saas_role_permissions');
    await trx.schema.dropTableIfExists('saas_roles');
    await trx.schema.dropTableIfExists('saas_permissions');
  });
};
