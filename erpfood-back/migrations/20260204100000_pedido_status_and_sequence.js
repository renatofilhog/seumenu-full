/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.transaction(async (trx) => {
    await trx.raw("CREATE SEQUENCE IF NOT EXISTS pedido_numero_seq");

    const hasPedidoStatusTable = await trx.schema.hasTable('pedido_status');
    if (!hasPedidoStatusTable) {
      await trx.schema.createTable('pedido_status', (t) => {
        t.increments('id').primary();
        t.string('value', 20).notNullable().unique();
        t.string('label', 50).notNullable();
      });

      await trx('pedido_status').insert([
        { value: 'em_analise', label: 'Em analise' },
        { value: 'preparando', label: 'Preparando' },
        { value: 'feito', label: 'Feito' },
      ]);
    }

    await trx.schema.table('pedidos', (t) => {
      t.integer('status_id')
        .unsigned()
        .references('id')
        .inTable('pedido_status')
        .onDelete('RESTRICT');
      t.timestamp('ultima_insercao').notNullable().defaultTo(trx.fn.now());
    });

    await trx.raw("ALTER TABLE pedidos ALTER COLUMN numero SET DEFAULT nextval('pedido_numero_seq')");
    await trx.raw(
      "SELECT setval('pedido_numero_seq', GREATEST(COALESCE((SELECT MAX(numero) FROM pedidos), 1), 1))"
    );
    await trx.raw("ALTER TABLE pedidos ALTER COLUMN data SET DEFAULT CURRENT_TIMESTAMP");

    await trx.raw(
      "UPDATE pedidos SET status_id = (SELECT id FROM pedido_status WHERE value = pedidos.status)"
    );

    await trx.schema.table('pedidos', (t) => {
      t.dropColumn('status');
    });

    await trx.schema.alterTable('pedidos', (t) => {
      t.integer('status_id')
        .unsigned()
        .notNullable()
        .alter();
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.transaction(async (trx) => {
    await trx.schema.table('pedidos', (t) => {
      t.string('status', 20).notNullable().defaultTo('em_analise');
    });

    await trx.raw(
      "UPDATE pedidos SET status = (SELECT value FROM pedido_status WHERE pedido_status.id = pedidos.status_id)"
    );

    await trx.schema.table('pedidos', (t) => {
      t.dropColumn('status_id');
      t.dropColumn('ultima_insercao');
    });

    await trx.raw("ALTER TABLE pedidos ALTER COLUMN numero DROP DEFAULT");
    await trx.raw("ALTER TABLE pedidos ALTER COLUMN data DROP DEFAULT");

    await trx.schema.dropTable('pedido_status');
    await trx.raw('DROP SEQUENCE IF EXISTS pedido_numero_seq');
  });
};
