import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { rateLimit } from "@/lib/guard";

// Records each consent choice (GAID 2025 asks controllers to keep proof of consent).
export async function POST(req: Request) {
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
  if (rateLimit(`consent:${vid}`, 10, 60_000)) {
    await db.insert(schema.consentRecords).values({ visitorId: vid, analytics: !!body.analytics }).catch(() => {});
  }
  return Response.json({ ok: true });
}
