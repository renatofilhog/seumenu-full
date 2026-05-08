/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('files', (t) => {
    t.increments('id').primary();
    t.integer('tenant_id').unsigned().nullable().references('id').inTable('tenants').onDelete('SET NULL');
    t.string('provider', 40).notNullable().defaultTo('s3');
    t.string('bucket', 150).notNullable();
    t.string('object_key', 500).notNullable();
    t.string('original_filename', 255).notNullable();
    t.string('content_type', 160).notNullable();
    t.bigInteger('size').notNullable();
    t.string('etag', 80).nullable();
    t.timestamp('deleted_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['tenant_id'], 'idx_files_tenant_id');
    t.index(['bucket'], 'idx_files_bucket');
    t.index(['object_key'], 'idx_files_object_key');
    t.index(['deleted_at'], 'idx_files_deleted_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('files');
};
