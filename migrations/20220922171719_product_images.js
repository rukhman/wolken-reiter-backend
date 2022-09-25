/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
	return knex.schema.createTable("product_images", (table) => {
		table.increments("id");
		table.integer("product_id").notNullable();
		table.foreign("product_id").references("products.id");
		table.text("image").notNullable();
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("product_images")
};
