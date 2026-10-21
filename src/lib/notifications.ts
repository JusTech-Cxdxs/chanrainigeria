import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { has, type StaffUser } from "./auth";
import { TYPE_LABEL } from "./labels";
import { getSettings } from "./settings";

/**
 * The dashboard bell, modelled on EJO 100: "Needs you" items are worked out live from the data (they
 * go away when the work is done), and "activity" items stay until the person opens or dismisses them.
 * Everything is limited to what the person's role can see.
 */
export type ActionItem = { id: string; kind: "machine_down" | "overdue" | "assigned" | "testimonials"; title: string; detail: string; url: string };
export type ActivityItem = { key: string; area: "enquiry" | "testimonial" | "team"; title: string; actor: string | null; at: string; url: string };
export type NotificationSummary = { actions: ActionItem[]; activity: ActivityItem[]; total: number; signature: string; muted: boolean };

const DAY = 86_400_000;

export async function notificationSummary(user: StaffUser): Promise<NotificationSummary> {
  const s = await getSettings();
  const E = schema.enquiries;
  const now = Date.now();
  const since = new Date(Math.max(now - 14 * DAY, user.notificationsReadAt ? new Date(user.notificationsReadAt).getTime() : 0));
  const actions: ActionItem[] = [];
  const activity: ActivityItem[] = [];

  const reads = new Set(
    (await db.select({ key: schema.notificationReads.key }).from(schema.notificationReads).where(eq(schema.notificationReads.userId, user.id))).map((r) => r.key),
  );

  if (has(user, "enquiries")) {
    const open = inArray(E.status, ["NEW", "IN_PROGRESS"]);
    const overdueBefore = new Date(now - s.enquiries.overdueHours * 3600_000);
    const desks = user.notifyDesks?.length ? user.notifyDesks : null;
    const [down, overdue, assigned, fresh] = await Promise.all([
      db.query.enquiries.findMany({
        where: and(open, sql`${E.details}->>'urgency' = 'machine_down'`),
        orderBy: [E.createdAt],
        limit: 5,
        columns: { id: true, ref: true, name: true, createdAt: true },
      }),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(E)
        .where(and(open, lt(E.createdAt, overdueBefore), sql`coalesce(${E.details}->>'urgency', '') <> 'machine_down'`)),
      db.query.enquiries.findMany({
        where: and(eq(E.assigneeId, user.id), eq(E.status, "NEW")),
        orderBy: [E.createdAt],
        limit: 5,
        columns: { id: true, ref: true, name: true, type: true },
      }),
      db.query.enquiries.findMany({
        where: and(gt(E.createdAt, since), desks ? inArray(E.desk, desks) : undefined),
        orderBy: [desc(E.createdAt)],
        limit: 20,
        columns: { id: true, ref: true, name: true, type: true, createdAt: true, source: true },
      }),
    ]);
    for (const e of down) {
      const h = Math.max(0, Math.floor((now - e.createdAt.getTime()) / 3600_000));
      actions.push({ id: `down:${e.id}`, kind: "machine_down", title: `Machine down: ${e.ref}`, detail: `${e.name}, waiting ${h < 1 ? "under an hour" : `${h} h`}`, url: `/admin/enquiries/${e.id}` });
    }
    const n = Number(overdue[0]?.n ?? 0);
    if (n) actions.push({ id: `overdue:${n}`, kind: "overdue", title: `${n} ${n === 1 ? "enquiry is" : "enquiries are"} overdue`, detail: `No reply after ${s.enquiries.overdueHours} hours`, url: "/admin/enquiries?status=open" });
    for (const e of assigned) actions.push({ id: `assigned:${e.id}`, kind: "assigned", title: `Assigned to you: ${e.ref}`, detail: `${TYPE_LABEL[e.type]} from ${e.name}`, url: `/admin/enquiries/${e.id}` });
    for (const e of fresh) {
      const key = `enq:${e.id}`;
      if (reads.has(key)) continue;
      activity.push({ key, area: "enquiry", title: `New ${TYPE_LABEL[e.type].toLowerCase()} from ${e.name} (${e.ref})`, actor: e.source === "ENYO" ? "Enyo" : "Website", at: e.createdAt.toISOString(), url: `/admin/enquiries/${e.id}` });
    }
  }

  if (has(user, "testimonials")) {
    const T = schema.testimonials;
    const [pending, fresh] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(T).where(eq(T.status, "PENDING")),
      db.query.testimonials.findMany({ where: and(eq(T.status, "PENDING"), gt(T.createdAt, since)), orderBy: [desc(T.createdAt)], limit: 10, columns: { id: true, name: true, createdAt: true } }),
    ]);
    const n = Number(pending[0]?.n ?? 0);
    if (n) actions.push({ id: `tst:${n}`, kind: "testimonials", title: `${n} testimonial${n === 1 ? "" : "s"} waiting for approval`, detail: "Nothing shows on the website until someone approves it", url: "/admin/testimonials" });
    for (const t of fresh) {
      const key = `tst:${t.id}`;
      if (!reads.has(key)) activity.push({ key, area: "testimonial", title: `${t.name} shared a testimonial`, actor: "Website", at: t.createdAt.toISOString(), url: "/admin/testimonials" });
    }
  }

  if (has(user, "audit")) {
    const A = schema.auditLogs;
    const rows = await db.query.auditLogs.findMany({
      where: and(gt(A.createdAt, new Date(Math.max(since.getTime(), now - 3 * DAY))), ne(A.actorId, user.id), inArray(A.action, ["create", "update", "delete", "restore"]), sql`${A.entity} not in ('session', 'cache', 'ai')`),
      orderBy: [desc(A.createdAt)],
      limit: 15,
      with: { actor: { columns: { name: true, role: true } } },
    });
    for (const r of rows) {
      const key = `aud:${r.id}`;
      if (reads.has(key)) continue;
      const actor = !r.actor ? "System" : r.actor.role === "MASTER" && !user.isMaster ? "System" : r.actor.name;
      activity.push({ key, area: "team", title: r.summary, actor, at: r.createdAt.toISOString(), url: "/admin/audit" });
    }
  }

  activity.sort((a, b) => b.at.localeCompare(a.at));
  const keys = [...actions.map((a) => a.id), ...activity.map((a) => a.key)].join("|");
  return {
    actions,
    activity,
    total: actions.length + activity.length,
    signature: createHash("sha1").update(keys).digest("base64url").slice(0, 16),
    muted: user.notificationsMuted,
  };
}

/** A tiny "has anything changed?" value, cheap enough to ask every few seconds. */
export async function notificationPulse() {
  const r = await db.execute<{ p: string }>(sql`
    select concat_ws(':',
      (select coalesce(max(updated_at)::text, '') from ${schema.enquiries}),
      (select count(*) from ${schema.enquiries} where status in ('NEW', 'IN_PROGRESS')),
      (select coalesce(max(created_at)::text, '') from ${schema.testimonials}),
      (select coalesce(max(created_at)::text, '') from ${schema.auditLogs}),
      floor(extract(epoch from now()) / 600)::text
    ) as p`);
  return createHash("sha1").update(String(r.rows[0]?.p ?? "")).digest("base64url").slice(0, 16);
}

export async function markRead(userId: string, keys: string[]) {
  const list = [...new Set(keys.filter((k) => /^(enq|tst|aud):[0-9a-f-]{36}$/i.test(k)))].slice(0, 100);
  if (!list.length) return;
  await db
    .insert(schema.notificationReads)
    .values(list.map((key) => ({ userId, key })))
    .onConflictDoNothing();
  if (Math.random() < 0.05) await db.delete(schema.notificationReads).where(lt(schema.notificationReads.createdAt, new Date(Date.now() - 30 * DAY)));
}

export async function markAllRead(userId: string) {
  await db.update(schema.adminUsers).set({ notificationsReadAt: new Date() }).where(eq(schema.adminUsers.id, userId));
  await db.delete(schema.notificationReads).where(eq(schema.notificationReads.userId, userId));
}
