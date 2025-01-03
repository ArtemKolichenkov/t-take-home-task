import { uuid, pgTable, customType } from "drizzle-orm/pg-core";

// Note: if migrations are erased - manually update migration with CREATE EXTENSION IF NOT EXISTS citext;
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: citext().notNull().unique(),
});
