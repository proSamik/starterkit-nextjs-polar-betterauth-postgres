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
    connectionString: url,
    ssl: process.env.NODE_ENV === "production", // Enable SSL in production only
    connectionTimeout: 10000, // 10 seconds timeout
  },
};
