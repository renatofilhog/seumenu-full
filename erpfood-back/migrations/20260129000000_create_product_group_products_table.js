/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasJoinTable = await knex.schema.hasTable('product_group_products');
  if (!hasJoinTable) {
    await knex.schema.createTable('product_group_products', (t) => {
      t.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      t.integer('product_group_id').unsigned().notNullable().references('id').inTable('product_groups').onDelete('CASCADE');
      t.primary(['product_id', 'product_group_id']);
    });
  }

  const hasProductGroupId = await knex.schema.hasColumn('products', 'product_group_id');
  if (hasProductGroupId) {
    const rows = await knex('products')
      .select('id', 'product_group_id')
      .whereNotNull('product_group_id');

    if (rows.length) {
      const insertRows = rows.map((row) => ({
        product_id: row.id,
        product_group_id: row.product_group_id,
      }));
      await knex.batchInsert('product_group_products', insertRows, 100);
    }

    await knex.schema.alterTable('products', (t) => {
      t.dropColumn('product_group_id');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasJoinTable = await knex.schema.hasTable('product_group_products');

  await knex.schema.alterTable('products', (t) => {
    t.integer('product_group_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('product_groups')
      .onDelete('CASCADE');
  });

  if (hasJoinTable) {
    const rows = await knex('product_group_products')
      .select('product_id')
      .min('product_group_id as product_group_id')
      .groupBy('product_id');

    for (const row of rows) {
      await knex('products').where({ id: row.product_id }).update({ product_group_id: row.product_group_id });
    }

    await knex.schema.dropTable('product_group_products');
  }
};
