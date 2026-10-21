// Applies the SQL migrations in ./drizzle. Safe to run on every start: already-applied steps are skipped.
// Plain JavaScript so it also runs inside the slim production container.
import { existsSync, readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url =
  process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
try {
  console.log(`Migrating database at ${new URL(url).host}`);
} catch {}
const pool = new pg.Pool({
  connectionString: url,
  ssl: /sslmode=require|supabase|neon\.tech/.test(url) ? { rejectUnauthorized: false } : undefined,
});
try {
  await migrate(drizzle(pool), { migrationsFolder: process.env.MIGRATIONS_DIR || "./drizzle" });
  console.log("Database is up to date.");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await pool.end();
}
