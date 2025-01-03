import * as schema from "./schema.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

export let db: ReturnType<typeof drizzle<typeof schema>>;

export const initDb = async () => {
  const pool = new pg.Pool({
    connectionString: process.env.DB_URL,
  });

  try {
    await pool.connect();
    console.info("Connected to database");
  } catch (error) {
    throw new Error(`Failed to connect to database ${String(error)}`);
  }

  db = drizzle(pool, {
    schema,
  });

  try {
    await migrate(db, {
      migrationsFolder: "./src/db/migrations",
    });
    console.info("Migrated database");
  } catch (error) {
    throw new Error(`Failed to migrate database ${String(error)}`);
  }
};
