import { timingSafeEqual } from "node:crypto";
import { siteUrl } from "@/lib/site-url";
import { and, asc, inArray, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { overdueDigest } from "@/lib/email-templates";
import { TYPE_LABEL } from "@/lib/labels";
import { emailContext, sendMail } from "@/lib/mail";
import { deskFor } from "@/lib/settings";

export const dynamic = "force-dynamic";

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  if (secret.length < 16) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/**
 * Daily reminder (08:00 Lagos): each desk gets the list of its open enquiries that are past the
 * overdue target or have a machine down. Called by the host's scheduler (vercel.json, or a cron
 * line on a server) with the CRON_SECRET header.
 */
export async function GET(req: Request) {
  if (!authorised(req)) return new Response("Not found", { status: 404 });
  const ctx = await emailContext();
  const s = ctx.s;
  if (!s.enquiries.sendDailyReminder) return Response.json({ sent: 0, reason: "switched off" });

  const E = schema.enquiries;
  const rows = await db.query.enquiries.findMany({
    where: and(
      inArray(E.status, ["NEW", "IN_PROGRESS"]),
      or(lt(E.createdAt, new Date(Date.now() - s.enquiries.overdueHours * 3600_000)), sql`${E.details}->>'urgency' = 'machine_down'`),
    ),
    orderBy: [asc(E.createdAt)],
    limit: 200,
    columns: { id: true, ref: true, name: true, type: true, desk: true, createdAt: true, details: true },
  });
  const base = siteUrl();
  const byDesk = new Map<string, typeof rows>();
  for (const r of rows) byDesk.set(r.desk, [...(byDesk.get(r.desk) ?? []), r]);

  let sent = 0;
  for (const [key, list] of byDesk) {
    const desk = deskFor(s, key);
    if (!desk.email) continue;
    const items = list.map((r) => ({
      ref: r.ref,
      name: r.name,
      type: TYPE_LABEL[r.type],
      hours: Math.floor((Date.now() - r.createdAt.getTime()) / 3600_000),
      urgent: r.details.urgency === "machine_down",
      link: `${base}/admin/enquiries/${r.id}`,
    }));
    if (await sendMail(s, { to: desk.email, ...overdueDigest(ctx, desk.label, items, `${base}/admin/enquiries?status=open`) })) sent++;
  }
  return Response.json({ sent, overdue: rows.length });
}
