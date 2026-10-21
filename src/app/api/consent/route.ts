import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { clientKey, rateLimit, sameOriginJson } from "@/lib/guard";
import { siteUrl } from "@/lib/site-url";

// Records each consent choice (GAID 2025 asks controllers to keep proof of consent).
export async function POST(req: Request) {
  if (!sameOriginJson(req, siteUrl())) return Response.json({ ok: false }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { analytics?: boolean };
  const jar = await cookies();
  let vid = jar.get("cn_vid")?.value;
  if (!vid) {
    vid = crypto.randomUUID();
    if (body.analytics) {
      jar.set("cn_vid", vid, { path: "/", maxAge: 60 * 60 * 24 * 180, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
    }
  }
  if (!body.analytics) jar.delete("cn_vid");
  if (await rateLimit(`consent:${await clientKey()}`, 10, 60_000)) {
    await db.insert(schema.consentRecords).values({ visitorId: vid, analytics: !!body.analytics }).catch(() => {});
  }
  return Response.json({ ok: true });
}
