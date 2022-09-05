/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
	return knex.schema.createTable("refresh_tokens", (table) => {
		table.increments("id");
		table.integer("user_id").notNullable();
		table.foreign("user_id").references("users.id");
		table.string("token", 255).notNullable()
		table.string("ip", 255).notNullable()
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("refresh_tokens")
};
