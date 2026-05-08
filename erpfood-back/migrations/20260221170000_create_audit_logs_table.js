/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('audit_logs', (t) => {
    t.increments('id').primary();
    t.integer('actor_user_id').unsigned().nullable().references('id').inTable('usuarios').onDelete('SET NULL');
    t.integer('tenant_id').unsigned().nullable().references('id').inTable('tenants').onDelete('SET NULL');
    t.string('entity_type', 60).notNullable();
    t.string('entity_id', 120).nullable();
    t.string('action', 80).notNullable();
    t.jsonb('details').nullable();
    t.string('request_id', 120).nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['tenant_id'], 'idx_audit_logs_tenant_id');
    t.index(['actor_user_id'], 'idx_audit_logs_actor_user_id');
    t.index(['action'], 'idx_audit_logs_action');
    t.index(['request_id'], 'idx_audit_logs_request_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
