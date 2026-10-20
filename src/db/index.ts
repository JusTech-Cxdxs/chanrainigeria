import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __chanraiPool: Pool | undefined;
}

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  return new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    ssl: /sslmode=require|supabase|neon\.tech/.test(url) ? { rejectUnauthorized: false } : undefined,
  });
}

// Reuse one pool across hot reloads in development.
const pool = globalThis.__chanraiPool ?? makePool();
if (process.env.NODE_ENV !== "production") globalThis.__chanraiPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
