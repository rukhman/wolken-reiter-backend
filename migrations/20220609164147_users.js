/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("users", (table) => {
		table.increments("id");
		table.string("name", 255).notNullable()
		table.string("surname", 255)
		table.string("phone", 30)
		table.string("country_code", 10)
		table.string("email", 255).notNullable().unique()
		table.string("password", 255).notNullable()	
		table.boolean("verified").notNullable().defaultTo(false)
	})
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("users")
};
