import "load-env";

const dialect = "postgresql";

const url = process.env.POSTGRES_URL!;

const schema = "./src/lib/db/pg/schema.pg.ts";

const out = "./src/lib/db/migrations/pg";

export default {
  schema,
  out,
  dialect,
  migrations: {},
  dbCredentials: {
    url,
    ssl: false,
  },
  // Increase connection timeout to prevent hanging
  connectionTimeout: 60000, // 1 minute
  // Reduce query timeout for faster failure if queries get stuck
  queryTimeout: 30000,
  // Enable verbose logging for debugging
  verbose: true,
  // Add a more specific driver configuration for pg
  driver: {
    options: {
      connection: {
        statement_timeout: 30000, // 30 seconds
      }
  },
};
