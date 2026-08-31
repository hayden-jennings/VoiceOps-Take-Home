import { Pool } from "pg";

export const db = new Pool({ connectionString: process.env.DATABASE_URL });

export const dbReadonly = new Pool({
  connectionString: process.env.DATABASE_URL_READONLY,
  statement_timeout: 3000,
});
