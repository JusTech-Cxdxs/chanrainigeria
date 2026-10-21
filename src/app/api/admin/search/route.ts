import { and, desc, ilike, ne, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentAdmin, has } from "@/lib/auth";
import { rateLimit } from "@/lib/guard";
import { TYPE_LABEL } from "@/lib/labels";

export const dynamic = "force-dynamic";

type Hit = { title: string; text?: string; href: string };

const PAGES: [string, string, string][] = [
  ["Overview", "/admin", "home dashboard summary overdue"],
  ["Notifications", "/admin/notifications", "notifications bell alerts sound mute"],
  ["Images", "/admin/images", "images pictures photos slider slides banners logos forklift excavator model upload"],
  ["Enquiries", "/admin/enquiries", "enquiries tickets requests bookings quotes"],
  ["Machines down", "/admin/enquiries?urgency=machine_down", "urgent machine down breakdown"],
  ["Enyo chats", "/admin/chats", "chat enyo conversations ai"],
  ["Testimonials", "/admin/testimonials", "testimonials reviews approve ratings"],
  ["Visitors", "/admin/visitors", "visitors analytics traffic statistics"],
  ["Products", "/admin/catalogue", "products catalogue models machines specs"],
  ["Specifications to check", "/admin/catalogue?unverified=1", "specs verify check"],
  ["Manufacturers", "/admin/catalogue/brands", "brands manufacturers logos trusted"],
  ["Services", "/admin/services", "services"],
  ["News", "/admin/news", "news posts stories"],
  ["Locations", "/admin/branches", "locations branches address offices"],
  ["Media library", "/admin/media", "media files uploads"],
  ["Settings", "/admin/settings", "settings company contact phone email colours logo desks enyo privacy"],
  ["Team", "/admin/team", "team users staff roles accounts"],
  ["Activity log", "/admin/audit", "audit activity log history"],
  ["Your account", "/admin/account", "password account profile"],
];

export async function GET(req: Request) {
  const user = await currentAdmin();
  if (!user) return Response.json({ groups: [] }, { status: 401 });
  if (!(await rateLimit(`asearch:${user.id}`, 120, 60_000))) return Response.json({ groups: [] }, { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ groups: [] });
  const like = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
  const r = user.role;
  const E = schema.enquiries;

  const [enq, chats, tms, models, news, team] = await Promise.all([
    has(user, "enquiries")
      ? db.query.enquiries.findMany({
          where: or(ilike(E.ref, like), ilike(E.name, like), ilike(E.email, like), ilike(E.company, like), ilike(E.phone, like), ilike(E.message, like)),
          orderBy: [desc(E.createdAt)],
          limit: 8,
          columns: { id: true, ref: true, name: true, company: true, type: true },
        })
      : [],
    has(user, "chats")
      ? db
          .selectDistinctOn([schema.chatMessages.sessionId], { id: schema.chatMessages.sessionId, content: schema.chatMessages.content })
          .from(schema.chatMessages)
          .where(ilike(schema.chatMessages.content, like))
          .limit(5)
      : [],
    db.query.testimonials.findMany({
      where: or(ilike(schema.testimonials.name, like), ilike(schema.testimonials.quote, like), ilike(schema.testimonials.company, like)),
      limit: 5,
      columns: { id: true, name: true, quote: true, status: true },
    }),
    has(user, "products")
      ? db.query.products.findMany({ where: ilike(schema.products.name, like), limit: 6, columns: { id: true, name: true, summary: true } })
      : [],
    has(user, "news") ? db.query.posts.findMany({ where: ilike(schema.posts.title, like), limit: 5, columns: { id: true, title: true } }) : [],
    has(user, "team")
      ? db.query.adminUsers.findMany({
          where: and(or(ilike(schema.adminUsers.name, like), ilike(schema.adminUsers.email, like)), r === "MASTER" ? undefined : ne(schema.adminUsers.role, "MASTER")),
          limit: 5,
          columns: { id: true, name: true, email: true },
        })
      : [],
  ]);

  const lower = q.toLowerCase();
  const groups: { label: string; hits: Hit[] }[] = [
    { label: "Enquiries", hits: enq.map((e) => ({ title: `${e.ref} · ${e.name}`, text: [TYPE_LABEL[e.type], e.company].filter(Boolean).join(", "), href: `/admin/enquiries/${e.id}` })) },
    { label: "Enyo chats", hits: chats.map((c) => ({ title: c.content.slice(0, 80), href: `/admin/chats/${c.id}` })) },
    { label: "Testimonials", hits: tms.map((t) => ({ title: t.name, text: `${t.status === "PENDING" ? "Waiting for approval. " : ""}${t.quote}`, href: `/admin/testimonials?focus=${t.id}` })) },
    { label: "Products", hits: models.map((p) => ({ title: p.name, text: p.summary, href: `/admin/catalogue/models/${p.id}` })) },
    { label: "News", hits: news.map((p) => ({ title: p.title, href: `/admin/news/${p.id}` })) },
    { label: "Team", hits: team.map((u) => ({ title: u.name, text: u.email, href: "/admin/team" })) },
    { label: "Dashboard pages", hits: PAGES.filter(([t, , w]) => t.toLowerCase().includes(lower) || w.includes(lower)).slice(0, 6).map(([title, href]) => ({ title, href })) },
  ].filter((g) => g.hits.length);
  return Response.json({ groups });
}
