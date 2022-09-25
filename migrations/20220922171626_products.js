/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("products", (table) => {
		table.increments("id");
		table.integer("user_id").notNullable();
		table.foreign("user_id").references("users.id");
		table.string("name", 255).notNullable();
		table.integer("price").notNullable();
		table.string("description", 3000).notNullable();
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("products")
};
