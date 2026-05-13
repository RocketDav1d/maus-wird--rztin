import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

let _client: ReturnType<typeof postgres> | null = null;
let _db: Db | null = null;

function init(): Db {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.local.example to .env.local and configure it.",
    );
  }
  _client = postgres(url, { prepare: false, max: 5, idle_timeout: 20 });
  _db = drizzle(_client, { schema });
  return _db;
}

/**
 * Proxy that defers connecting until the first query. Keeps the dev server
 * bootable when .env.local hasn't been filled in yet.
 */
export const db = new Proxy({} as Db, {
  get(_t, prop) {
    const target = init();
    const value = Reflect.get(target, prop, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
}) as Db;

export { schema };
