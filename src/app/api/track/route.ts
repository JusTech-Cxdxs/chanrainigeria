import { cookies, headers } from "next/headers";
import { siteUrl } from "@/lib/site-url";
import { db, schema } from "@/db";
import { clientKey, rateLimit, sameOriginJson } from "@/lib/guard";

// Campaign tags we recognise; anything else is ignored so the reports can't be filled with junk.
const SOURCES = new Set(["google", "facebook", "instagram", "linkedin", "x", "twitter", "whatsapp", "youtube", "tiktok", "email", "newsletter", "qr", "flyer", "brochure", "event"]);

function device(ua: string) {
  if (/bot|crawl|spider|preview|headless/i.test(ua)) return null;
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function sourceFrom(referrer: string | null, explicit: string | null) {
  const tag = explicit?.toLowerCase().trim();
  if (tag && SOURCES.has(tag)) return tag;
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    const self = new URL(siteUrl()).hostname.replace(/^www\./, "");
    return host === self ? null : host;
  } catch {
    return null;
  }
}

// Counts a page view. Only called by the browser after the visitor accepts statistics.
export async function POST(req: Request) {
  if (!sameOriginJson(req, siteUrl())) return new Response(null, { status: 204 });
  if (!(await rateLimit(`track-ip:${await clientKey()}`, 120, 60_000))) return new Response(null, { status: 204 });
  const jar = await cookies();
  if (jar.get("cn_consent")?.value !== "granted") return new Response(null, { status: 204 });
  const ua = (await headers()).get("user-agent") ?? "";
  const dev = device(ua);
  if (!dev) return new Response(null, { status: 204 });

  let vid = jar.get("cn_vid")?.value;
  if (!vid) {
    vid = crypto.randomUUID();
    jar.set("cn_vid", vid, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  }
  if (!(await rateLimit(`track:${vid}`, 60, 60_000))) return new Response(null, { status: 204 });

  const b = (await req.json().catch(() => ({}))) as { path?: string; referrer?: string | null; source?: string | null };
  const path = String(b.path ?? "/").slice(0, 300);
  if (path.startsWith("/admin")) return new Response(null, { status: 204 });
  await db
    .insert(schema.pageViews)
    .values({
      path,
      referrer: b.referrer ? String(b.referrer).slice(0, 300) : null,
      source: sourceFrom(b.referrer ?? null, b.source ?? null),
      device: dev,
      visitorId: vid,
    })
    .catch(() => {});
  return new Response(null, { status: 204 });
}
