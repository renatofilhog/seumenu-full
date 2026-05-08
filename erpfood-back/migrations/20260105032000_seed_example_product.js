/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.transaction(async (trx) => {
    await trx.schema.alterTable('products', (t) => {
      t.string('imagem_url', 255).nullable().alter();
    });

    const groupName = 'Pizzas';
    let group = await trx('product_groups').where({ nome: groupName }).first();
    if (!group) {
      const inserted = await trx('product_groups')
        .insert({ nome: groupName, ativo: true, ordem: 1 })
        .returning('id');
      const groupId = Array.isArray(inserted) ? inserted[0].id ?? inserted[0] : inserted.id ?? inserted;
      group = await trx('product_groups').where({ id: groupId }).first();
    }

    const additionalName = 'queijo';
    let additional = await trx('additionals').where({ nome: additionalName }).first();
    if (!additional) {
      const inserted = await trx('additionals')
        .insert({ nome: additionalName, quantidade_max: 2, preco: '1.99', ativo: true })
        .returning('id');
      const additionalId = Array.isArray(inserted) ? inserted[0].id ?? inserted[0] : inserted.id ?? inserted;
      additional = await trx('additionals').where({ id: additionalId }).first();
    }

    const productName = 'X-burguer';
    let product = await trx('products').where({ nome: productName }).first();
    if (!product) {
      const hasProductGroupId = await trx.schema.hasColumn('products', 'product_group_id');
      const inserted = await trx('products')
        .insert({
          nome: productName,
          descricao: 'Hamburguer com pao brioche, carne artesanal e alface.',
          preco: '24.99',
          ativo: true,
          imagem_url: null,
          ordem: 1,
          ...(hasProductGroupId ? { product_group_id: group.id } : {}),
        })
        .returning('id');
      const productId = Array.isArray(inserted) ? inserted[0].id ?? inserted[0] : inserted.id ?? inserted;
      product = await trx('products').where({ id: productId }).first();
    }

    const hasJoinTable = await trx.schema.hasTable('product_group_products');
    if (hasJoinTable) {
      const groupLink = await trx('product_group_products')
        .where({ product_id: product.id, product_group_id: group.id })
        .first();
      if (!groupLink) {
        await trx('product_group_products').insert({
          product_id: product.id,
          product_group_id: group.id,
        });
      }
    }

    const productAdditional = await trx('product_additionals')
      .where({ product_id: product.id, additional_id: additional.id })
      .first();
    if (!productAdditional) {
      await trx('product_additionals').insert({
        product_id: product.id,
        additional_id: additional.id,
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
    const product = await trx('products').where({ nome: 'X-burguer' }).first();
    const additional = await trx('additionals').where({ nome: 'queijo' }).first();

    if (product && additional) {
      await trx('product_additionals')
        .where({ product_id: product.id, additional_id: additional.id })
        .del();
    }

    if (product) {
      await trx('products').where({ id: product.id }).del();
    }

    if (additional) {
      await trx('additionals').where({ id: additional.id }).del();
    }

    await trx('product_groups').where({ nome: 'Pizzas' }).del();

    await trx.schema.alterTable('products', (t) => {
      t.string('imagem_url', 255).notNullable().alter();
    });
  });
};
