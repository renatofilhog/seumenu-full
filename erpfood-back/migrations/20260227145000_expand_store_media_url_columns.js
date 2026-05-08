/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasLojas = await trx.schema.hasTable('lojas');
    if (!hasLojas) {
      return;
    }

    const hasBannerUrl = await trx.schema.hasColumn('lojas', 'banner_url');
    const hasLogoUrl = await trx.schema.hasColumn('lojas', 'logo_url');

    if (hasBannerUrl) {
      await trx.raw('ALTER TABLE lojas ALTER COLUMN banner_url TYPE text');
    }

    if (hasLogoUrl) {
      await trx.raw('ALTER TABLE lojas ALTER COLUMN logo_url TYPE text');
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.transaction(async (trx) => {
    const hasLojas = await trx.schema.hasTable('lojas');
    if (!hasLojas) {
      return;
    }

    const hasBannerUrl = await trx.schema.hasColumn('lojas', 'banner_url');
    const hasLogoUrl = await trx.schema.hasColumn('lojas', 'logo_url');

    if (hasBannerUrl) {
      await trx.raw('ALTER TABLE lojas ALTER COLUMN banner_url TYPE varchar(255)');
    }

    if (hasLogoUrl) {
      await trx.raw('ALTER TABLE lojas ALTER COLUMN logo_url TYPE varchar(255)');
    }
  });
};
