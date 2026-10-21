import "server-only";
import { and, asc, count, countDistinct, desc, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { enquiries: E, pageViews: V, products: P, chatSessions: C } = schema;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export async function overview(overdueHours: number) {
  const since7 = daysAgo(7);
  const since30 = daysAgo(30);
  const open = inArray(E.status, ["NEW", "IN_PROGRESS"]);

  const [
    [{ n: newCount }],
    [{ n: openCount }],
    [{ n: downCount }],
    [{ n: week }],
    byType,
    bySource,
    [{ visitors, views }],
    topPages,
    topSources,
    [{ n: unverified }],
    [{ n: chats7 }],
    recent,
    daily,
    overdue,
    [{ n: pendingTestimonials }],
  ] = await Promise.all([
    db.select({ n: count() }).from(E).where(eq(E.status, "NEW")),
    db.select({ n: count() }).from(E).where(open),
    db.select({ n: count() }).from(E).where(and(open, sql`${E.details}->>'urgency' = 'machine_down'`)),
    db.select({ n: count() }).from(E).where(gte(E.createdAt, since7)),
    db.select({ type: E.type, n: count() }).from(E).where(gte(E.createdAt, since30)).groupBy(E.type),
    db.select({ source: E.source, n: count() }).from(E).where(gte(E.createdAt, since30)).groupBy(E.source),
    db.select({ visitors: countDistinct(V.visitorId), views: count() }).from(V).where(gte(V.createdAt, since7)),
    db.select({ path: V.path, n: count() }).from(V).where(gte(V.createdAt, since30)).groupBy(V.path).orderBy(desc(count())).limit(8),
    db
      .select({ source: V.source, n: count() })
      .from(V)
      .where(and(gte(V.createdAt, since30), sql`${V.source} is not null`))
      .groupBy(V.source)
      .orderBy(desc(count()))
      .limit(6),
    db.select({ n: count() }).from(P).where(eq(P.specsVerified, false)),
    db.select({ n: count() }).from(C).where(gte(C.createdAt, since7)),
    db.query.enquiries.findMany({ orderBy: [desc(E.createdAt)], limit: 6, with: { product: { columns: { name: true } } } }),
    db.execute<{ day: string; enquiries: number; visitors: number }>(sql`
      with d as (select generate_series((now() at time zone 'Africa/Lagos')::date - 13, (now() at time zone 'Africa/Lagos')::date, '1 day')::date as day)
      select to_char(d.day, 'YYYY-MM-DD') as day,
        (select count(*)::int from ${E} e where (e.created_at at time zone 'Africa/Lagos')::date = d.day) as enquiries,
        (select count(distinct v.visitor_id)::int from ${V} v where (v.created_at at time zone 'Africa/Lagos')::date = d.day) as visitors
      from d order by d.day`),
    db.query.enquiries.findMany({
      where: and(open, or(lt(E.createdAt, new Date(Date.now() - overdueHours * 3600_000)), sql`${E.details}->>'urgency' = 'machine_down'`)),
      orderBy: [asc(E.createdAt)],
      limit: 8,
      columns: { id: true, ref: true, name: true, type: true, createdAt: true, details: true, status: true },
    }),
    db.select({ n: count() }).from(schema.testimonials).where(eq(schema.testimonials.status, "PENDING")),
  ]);

  return {
    newCount,
    openCount,
    downCount,
    week,
    byType,
    bySource,
    visitors,
    views,
    topPages,
    topSources,
    unverified,
    chats7,
    recent,
    daily: daily.rows,
    overdue,
    pendingTestimonials,
  };
}
