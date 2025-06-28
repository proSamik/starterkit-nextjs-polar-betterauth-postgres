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
    ssl: false, // Disable SSL for development
    connectionTimeout: 30000, // Increase timeout to 30 seconds
  },
};
