import "server-only";
import { headers } from "next/headers";

// Small in-memory rate limiter. Enough for one server instance; resets on restart.
const hits = new Map<string, number[]>();

export async function clientKey() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) return false;
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

/** Bots fill hidden fields and submit instantly; people don't. */
export function looksLikeBot(form: FormData) {
  if (String(form.get("website") ?? "").trim()) return true;
  const started = Number(form.get("_t") ?? 0);
  return started > 0 && Date.now() - started < 2500;
}

export const ALLOWED_UPLOADS = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
