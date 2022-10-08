/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
	return knex.schema.createTable("in_favorite", (table) => {
		table.increments("id");
		table.integer("user_id").notNullable();
		table.foreign("user_id").references("users.id");
		table.integer("product_id").notNullable();
		table.foreign("product_id").references("products.id");
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("in_favorite");
};
