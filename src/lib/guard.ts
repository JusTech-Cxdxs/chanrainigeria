import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";

/**
 * The visitor's address. Only one header is trusted, the one the hosting platform or reverse proxy
 * overwrites, because any other header can be typed in by the visitor to dodge rate limits.
 * On Vercel that is x-vercel-forwarded-for. Elsewhere set TRUSTED_IP_HEADER to the header your proxy
 * sets (for example cf-connecting-ip behind Cloudflare, x-real-ip behind nginx). Without it every
 * visitor shares one bucket, which is strict but safe.
 */
export async function clientIp() {
  const h = await headers();
  const name = (process.env.TRUSTED_IP_HEADER || (process.env.VERCEL ? "x-vercel-forwarded-for" : "")).toLowerCase();
  const v = name ? h.get(name)?.split(",")[0]?.trim() : "";
  return v || "untrusted";
}

/**
 * Rejects requests that come from another website or aren't JSON. Stops a third-party page from
 * making its visitors' browsers post to our endpoints.
 */
export function sameOriginJson(req: Request, site: string) {
  const origin = req.headers.get("origin");
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return false;
  if (!origin) return true; // Same-origin fetches from older browsers can omit it; the JSON type still forces a preflight.
  try {
    const want = new URL(site).origin;
    const own = new URL(req.url).origin;
    return origin === want || origin === own;
  } catch {
    return false;
  }
}

/** A one-way hash of the address, so rate-limit rows never store an IP in plain text. */
export async function clientKey() {
  const salt = process.env.AUTH_SECRET ?? "chanrai";
  return createHash("sha256").update(`${salt}:${await clientIp()}`).digest("base64url").slice(0, 22);
}

/**
 * Fixed-window rate limit kept in the database, so it holds across every server instance
 * (serverless functions, several containers). Returns true when the request may go ahead.
 * Fails open if the database is unreachable, so an outage never blocks visitors; sign-in and setup
 * pass failClosed so they refuse instead.
 */
export async function rateLimit(key: string, limit: number, windowMs: number, opts: { failClosed?: boolean; cost?: number } = {}): Promise<boolean> {
  try {
    const seconds = Math.max(1, Math.round(windowMs / 1000));
    const cost = Math.max(1, Math.floor(opts.cost ?? 1));
    const r = await db.execute<{ count: number }>(sql`
      insert into ${schema.rateLimits} (key, count, window_start) values (${key}, ${cost}, now())
      on conflict (key) do update set
        count = case when ${schema.rateLimits.windowStart} < now() - make_interval(secs => ${seconds}) then ${cost} else ${schema.rateLimits.count} + ${cost} end,
        window_start = case when ${schema.rateLimits.windowStart} < now() - make_interval(secs => ${seconds}) then now() else ${schema.rateLimits.windowStart} end
      returning count`);
    if (Math.random() < 0.01) {
      await db.execute(sql`delete from ${schema.rateLimits} where window_start < now() - interval '1 day'`);
    }
    return Number(r.rows[0]?.count ?? 0) <= limit;
  } catch (e) {
    console.error("[rate-limit]", e);
    return !opts.failClosed;
  }
}

/** Bots fill hidden fields and submit instantly; people don't. */
export function looksLikeBot(form: FormData) {
  if (String(form.get("website") ?? "").trim()) return true;
  const started = Number(form.get("_t") ?? 0);
  return started > 0 && Date.now() - started < 2500;
}

/** Text that is mostly links or contains HTML is almost always spam. */
export function looksLikeSpam(text: string) {
  const links = (text.match(/https?:\/\/|www\./gi) ?? []).length;
  return links > 1 || /<\/?[a-z][\s\S]*>/i.test(text) || /\[url=|\[link=/i.test(text);
}

export const ALLOWED_UPLOADS = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
