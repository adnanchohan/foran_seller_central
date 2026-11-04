import { drizzle } from "drizzle-orm/d1";
import * as schema from "@foran/db";

export type Database = ReturnType<typeof createDrizzleDb>;

export function createDrizzleDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
