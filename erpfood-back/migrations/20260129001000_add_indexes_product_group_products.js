/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasJoinTable = await knex.schema.hasTable('product_group_products');
  if (!hasJoinTable) {
    return;
  }

  await knex.schema.alterTable('product_group_products', (t) => {
    t.index(['product_group_id'], 'idx_product_group_products_group');
    t.index(['product_id'], 'idx_product_group_products_product');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasJoinTable = await knex.schema.hasTable('product_group_products');
  if (!hasJoinTable) {
    return;
  }

  await knex.schema.alterTable('product_group_products', (t) => {
    t.dropIndex(['product_group_id'], 'idx_product_group_products_group');
    t.dropIndex(['product_id'], 'idx_product_group_products_product');
  });
};
