const { randomBytes, scryptSync } = require('crypto');

function hashPassword(value) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  if (value.startsWith('scrypt$')) {
    return value;
  }

  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(value, salt, 64);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    await trx.schema.alterTable('usuarios', (table) => {
      table.string('senha', 255).notNullable().alter();
    });

    const hasSaasTable = await trx.schema.hasTable('saas_management_users');
    if (hasSaasTable) {
      await trx.schema.alterTable('saas_management_users', (table) => {
        table.string('senha', 255).notNullable().alter();
      });
    }

    const users = await trx('usuarios').select('id', 'senha');
    for (const user of users) {
      const hashedPassword = hashPassword(user.senha);
      if (hashedPassword !== user.senha) {
        await trx('usuarios').where({ id: user.id }).update({ senha: hashedPassword });
      }
    }

    if (hasSaasTable) {
      const saasUsers = await trx('saas_management_users').select('id', 'senha');
      for (const user of saasUsers) {
        const hashedPassword = hashPassword(user.senha);
        if (hashedPassword !== user.senha) {
          await trx('saas_management_users').where({ id: user.id }).update({ senha: hashedPassword });
        }
      }
    }
  });
};

exports.down = async function () {
  // Hash migration is intentionally irreversible.
};
