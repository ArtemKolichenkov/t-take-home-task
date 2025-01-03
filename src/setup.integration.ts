import { db } from "./db/index.js";
import { usersTable } from "./db/schema.js";

beforeEach(async () => {
  await db.delete(usersTable);
});
