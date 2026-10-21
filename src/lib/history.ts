import "server-only";
import { eq, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidateTag } from "next/cache";
import { db, schema } from "@/db";

/**
 * Undo for the whole dashboard. Before anything is changed or deleted, a copy of it as it was is kept
 * in `revisions`. Restoring puts that copy back (and first keeps a copy of the current state, so a
 * restore can itself be undone). Uploaded file bytes are never copied: media deletes are soft.
 */
type Entity = {
  label: string;
  table: PgTable;
  /** Primary-key column name (camelCase, as Drizzle returns rows) */
  key: string;
  /** Where to look at the item in the dashboard */
  href: (id: string) => string;
  /** Cache tags to clear after a restore */
  tags: string[];
  /** Columns never stored in history (large or secret) */
  omit?: string[];
};

export const ENTITIES = {
  settings: { label: "Company settings", table: schema.siteSettings, key: "id", href: () => "/admin/settings", tags: ["settings"] },
  page: { label: "Page", table: schema.pageContent, key: "page", href: (id) => `/admin/pages/${id}`, tags: ["content"] },
  category: { label: "Product line", table: schema.categories, key: "id", href: (id) => `/admin/catalogue/lines/${id}`, tags: ["catalogue"] },
  family: { label: "Machine type", table: schema.families, key: "id", href: (id) => `/admin/catalogue/types/${id}`, tags: ["catalogue"] },
  product: { label: "Model", table: schema.products, key: "id", href: (id) => `/admin/catalogue/models/${id}`, tags: ["catalogue"] },
  brand: { label: "Brand", table: schema.brands, key: "id", href: () => "/admin/catalogue/brands", tags: ["catalogue"] },
  service: { label: "Service", table: schema.services, key: "id", href: () => "/admin/services", tags: ["catalogue"] },
  post: { label: "News post", table: schema.posts, key: "id", href: (id) => `/admin/news/${id}`, tags: ["posts"] },
  branch: { label: "Location", table: schema.branches, key: "id", href: () => "/admin/branches", tags: ["branches"] },
  testimonial: { label: "Testimonial", table: schema.testimonials, key: "id", href: () => "/admin/testimonials", tags: ["testimonials"] },
  role: { label: "Role", table: schema.roles, key: "id", href: () => "/admin/team/roles", tags: [] },
  media: { label: "File", table: schema.media, key: "id", href: () => "/admin/media", tags: ["settings", "content", "catalogue", "posts"], omit: ["data"] },
} satisfies Record<string, Entity>;

export type EntityKey = keyof typeof ENTITIES;
export const isEntity = (v: string): v is EntityKey => v in ENTITIES;

function strip(entity: EntityKey, row: Record<string, unknown>) {
  const omit = (ENTITIES[entity] as Entity).omit ?? [];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (!omit.includes(k) && typeof v !== "function") out[k] = v;
  return out;
}

/** Keep a copy of a record as it is now. Never throws: history must not block the edit itself. */
export async function recordRevision(entity: EntityKey, entityId: string, label: string, action: "update" | "delete" | "restore", row: unknown, actorId: string | null) {
  if (!row || typeof row !== "object") return;
  try {
    await db.insert(schema.revisions).values({ entity, entityId, label: label.slice(0, 200), action, data: strip(entity, row as Record<string, unknown>), actorId });
    if (Math.random() < 0.02) await db.execute(sql`delete from ${schema.revisions} where created_at < now() - interval '365 days'`);
  } catch (e) {
    console.error("[history]", e);
  }
}

/** Load the record by key and keep a copy of it. Call this right before saving or deleting. */
export async function snapshot(entity: EntityKey, entityId: string, label: string, action: "update" | "delete", actorId: string | null) {
  const e = ENTITIES[entity] as Entity;
  const cols = getTableColumns(e.table) as Record<string, never>;
  const rows = await db.select().from(e.table).where(eq(cols[e.key], entityId)).limit(1);
  if (rows[0]) await recordRevision(entity, entityId, label, action, rows[0], actorId);
}

/** Turn JSON back into column values (dates come back from JSON as strings). */
function revive(entity: EntityKey, data: Record<string, unknown>) {
  const cols = getTableColumns((ENTITIES[entity] as Entity).table) as Record<string, { dataType: string }>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!cols[k]) continue;
    out[k] = cols[k].dataType === "date" && typeof v === "string" ? new Date(v) : v;
  }
  return out;
}

/** Put a stored version back. Returns the entity and id restored. */
export async function restoreRevision(revisionId: string, actorId: string) {
  const rev = await db.query.revisions.findFirst({ where: eq(schema.revisions.id, revisionId) });
  if (!rev || !isEntity(rev.entity)) throw new Error("That version no longer exists.");
  const entity = rev.entity;
  const e = ENTITIES[entity] as Entity;
  const cols = getTableColumns(e.table) as Record<string, never>;
  const values = revive(entity, rev.data as Record<string, unknown>);

  // Keep the current state first, so this restore can be undone too.
  await snapshot(entity, rev.entityId, rev.label, "update", actorId);

  const exists = (await db.select().from(e.table).where(eq(cols[e.key], rev.entityId)).limit(1))[0];
  if (entity === "media") {
    // Files are soft-deleted; restoring brings back the name, folder and alt text and undeletes it.
    await db
      .update(schema.media)
      .set({ alt: String(values.alt ?? ""), folder: String(values.folder ?? ""), filename: String(values.filename ?? "file"), deletedAt: null })
      .where(eq(schema.media.id, rev.entityId));
  } else if (exists) {
    const rest = { ...values };
    delete rest[e.key];
    await db.update(e.table).set(rest as never).where(eq(cols[e.key], rev.entityId));
  } else {
    await db.insert(e.table).values(values as never);
  }
  for (const t of e.tags) revalidateTag(t);
  return { entity, entityId: rev.entityId, label: rev.label, href: e.href(rev.entityId) };
}
