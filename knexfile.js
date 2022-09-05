require("dotenv").config()

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_BASE_NAME,
    user: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
};
