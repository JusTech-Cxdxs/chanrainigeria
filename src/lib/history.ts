import "server-only";
import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath, revalidateTag } from "next/cache";
import { db, schema } from "@/db";
import type { Permission } from "./permissions";

/**
 * Undo for the whole dashboard. Before anything is changed or deleted, a copy of it as it was is kept
 * in `revisions`. Restoring puts that copy back (and first keeps a copy of the current state, so a
 * restore can itself be undone). File bytes are not copied into revisions: media deletes are soft, and
 * when a file is replaced its old bytes are kept as a hidden media row whose id is stored in the revision.
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
  /** Section a person needs to restore this from its own page (History and undo can restore anything) */
  perm: Permission;
  /** Column holding a readable name, used when the stored label is missing */
  nameKey?: string;
};

export const ENTITIES = {
  settings: { label: "Company settings", table: schema.siteSettings, key: "id", href: () => "/admin/settings", tags: ["settings"], perm: "settings" },
  page: { label: "Page", table: schema.pageContent, key: "page", href: (id) => `/admin/pages/${id}`, tags: ["content"], perm: "pages" },
  category: { label: "Product line", table: schema.categories, key: "id", href: (id) => `/admin/catalogue/lines/${id}`, tags: ["catalogue"], perm: "products", nameKey: "name" },
  family: { label: "Machine type", table: schema.families, key: "id", href: (id) => `/admin/catalogue/types/${id}`, tags: ["catalogue"], perm: "products", nameKey: "name" },
  product: { label: "Model", table: schema.products, key: "id", href: (id) => `/admin/catalogue/models/${id}`, tags: ["catalogue"], perm: "products", nameKey: "name" },
  brand: { label: "Brand", table: schema.brands, key: "id", href: (id) => `/admin/catalogue/brands/${id}`, tags: ["catalogue"], perm: "brands", nameKey: "name" },
  service: { label: "Service", table: schema.services, key: "id", href: () => "/admin/services", tags: ["catalogue"], perm: "services", nameKey: "name" },
  post: { label: "News post", table: schema.posts, key: "id", href: (id) => `/admin/news/${id}`, tags: ["posts"], perm: "news", nameKey: "title" },
  branch: { label: "Location", table: schema.branches, key: "id", href: () => "/admin/branches", tags: ["branches"], perm: "locations", nameKey: "name" },
  testimonial: { label: "Testimonial", table: schema.testimonials, key: "id", href: () => "/admin/testimonials", tags: ["testimonials"], perm: "testimonials", nameKey: "name" },
  role: { label: "Role", table: schema.roles, key: "id", href: () => "/admin/team/roles", tags: [], perm: "team", nameKey: "name" },
  media: {
    label: "File",
    table: schema.media,
    key: "id",
    href: (id) => `/admin/media?file=${id}`,
    tags: ["settings", "content", "catalogue", "posts"],
    omit: ["data"],
    perm: "media",
    nameKey: "filename",
  },
} satisfies Record<string, Entity>;

export type EntityKey = keyof typeof ENTITIES;
export const isEntity = (v: string): v is EntityKey => v in ENTITIES;
export type RevisionAction = "update" | "delete" | "restore";

/** Hidden media folder for earlier versions of replaced files (kept in sync with src/lib/media.ts). */
const HISTORY_FOLDER = "__history";

function strip(entity: EntityKey, row: Record<string, unknown>) {
  const omit = (ENTITIES[entity] as Entity).omit ?? [];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (!omit.includes(k) && typeof v !== "function") out[k] = v;
  return out;
}

/** Keep a copy of a record as it is now. Never throws: history must not block the edit itself. */
export async function recordRevision(entity: EntityKey, entityId: string, label: string, action: RevisionAction, row: unknown, actorId: string | null) {
  if (!row || typeof row !== "object") return;
  try {
    await db.insert(schema.revisions).values({ entity, entityId, label: label.slice(0, 200), action, data: strip(entity, row as Record<string, unknown>), actorId });
    if (Math.random() < 0.02) await db.execute(sql`delete from ${schema.revisions} where created_at < now() - interval '365 days'`);
  } catch (e) {
    console.error("[history]", e);
  }
}

/** Load the record by key and keep a copy of it. Call this right before saving or deleting. */
export async function snapshot(entity: EntityKey, entityId: string, label: string, action: RevisionAction, actorId: string | null) {
  try {
    const e = ENTITIES[entity] as Entity;
    const cols = getTableColumns(e.table) as Record<string, never>;
    const rows = await db.select().from(e.table).where(eq(cols[e.key], entityId)).limit(1);
    if (rows[0]) await recordRevision(entity, entityId, label, action, rows[0], actorId);
    else if (entity === "page") {
      // First edit of a page: remember that it was on its original wording, so the edit can be undone.
      await recordRevision("page", entityId, label, action, { page: entityId, data: {}, updatedById: null, updatedAt: new Date() }, actorId);
    }
  } catch (e) {
    console.error("[history]", e);
  }
}

/**
 * Before a file's bytes change: copy the current bytes into a hidden media row and keep a revision that
 * points at it, so the file can be swapped back later. Returns the hidden row's id.
 */
export async function snapshotMediaBytes(mediaId: string, label: string, action: RevisionAction, actorId: string | null) {
  const cur = await db.query.media.findFirst({ where: eq(schema.media.id, mediaId) });
  if (!cur) return null;
  const [copy] = await db
    .insert(schema.media)
    .values({
      filename: cur.filename,
      mimeType: cur.mimeType,
      size: cur.size,
      alt: cur.alt,
      isPrivate: true,
      data: cur.data,
      folder: HISTORY_FOLDER,
      width: cur.width,
      height: cur.height,
      uploadedById: cur.uploadedById,
      deletedAt: new Date(),
    })
    .returning({ id: schema.media.id });
  await recordRevision("media", mediaId, label, action, { ...strip("media", cur), bytesId: copy.id }, actorId);
  return copy.id;
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

function refreshAfter(entity: EntityKey) {
  for (const t of (ENTITIES[entity] as Entity).tags) revalidateTag(t);
  revalidatePath("/", "layout");
}

/** Put a stored version back. Returns the entity and id restored. */
export async function restoreRevision(revisionId: string, actorId: string) {
  const rev = await db.query.revisions.findFirst({ where: eq(schema.revisions.id, revisionId) });
  if (!rev || !isEntity(rev.entity)) throw new Error("That version no longer exists.");
  const entity = rev.entity;
  const e = ENTITIES[entity] as Entity;
  const cols = getTableColumns(e.table) as Record<string, never>;
  const stored = rev.data as Record<string, unknown>;
  const values = revive(entity, stored);

  if (entity === "media") {
    const cur = await db.query.media.findFirst({ where: eq(schema.media.id, rev.entityId), columns: { data: false } });
    if (!cur) throw new Error("This file was removed for good more than 30 days after it was deleted, so it can't be brought back.");
    const bytesId = typeof stored.bytesId === "string" ? stored.bytesId : null;
    const old = bytesId ? await db.query.media.findFirst({ where: eq(schema.media.id, bytesId) }) : null;
    if (bytesId && !old) throw new Error("The earlier copy of this file is no longer kept, so it can't be swapped back.");
    // Keep the current state (with its bytes when they are about to change), so this restore can be undone.
    if (old) await snapshotMediaBytes(rev.entityId, rev.label, "restore", actorId);
    else await snapshot("media", rev.entityId, rev.label, "restore", actorId);
    await db
      .update(schema.media)
      .set({
        alt: String(values.alt ?? cur.alt),
        folder: String(values.folder ?? cur.folder),
        filename: String(values.filename ?? cur.filename),
        deletedAt: null,
        ...(old ? { data: old.data, mimeType: old.mimeType, size: old.size, width: old.width, height: old.height } : {}),
      })
      .where(eq(schema.media.id, rev.entityId));
  } else {
    // Keep the current state first, so this restore can be undone too.
    await snapshot(entity, rev.entityId, rev.label, "restore", actorId);
    const exists = (await db.select().from(e.table).where(eq(cols[e.key], rev.entityId)).limit(1))[0];
    try {
      if (exists) {
        const rest = { ...values };
        delete rest[e.key];
        if ("updatedAt" in rest) delete rest.updatedAt;
        await db.update(e.table).set(rest as never).where(eq(cols[e.key], rev.entityId));
      } else {
        await db.insert(e.table).values(values as never);
      }
    } catch (err) {
      console.error("[history] restore", err);
      const msg = String((err as { cause?: { message?: string } })?.cause?.message ?? (err as Error)?.message ?? "");
      if (/foreign key/i.test(msg)) throw new Error("This version belongs to something that has since been deleted (for example its product line). Restore that first, then try again.");
      if (/unique/i.test(msg)) throw new Error("Another item now uses the same web address or name. Rename that one first, then try again.");
      throw new Error("This version couldn't be restored.");
    }
  }
  refreshAfter(entity);
  return { entity, entityId: rev.entityId, label: rev.label, href: e.href(rev.entityId) };
}

/** Recent versions of one item, newest first, with who saved them. */
export async function itemRevisions(entity: EntityKey, entityId: string, limit = 6) {
  return db.query.revisions.findMany({
    where: and(eq(schema.revisions.entity, entity), eq(schema.revisions.entityId, entityId)),
    orderBy: [desc(schema.revisions.createdAt)],
    limit,
    columns: { data: false },
    with: { actor: { columns: { name: true, role: true } } },
  });
}

/** Readable wording for what a revision captured. */
export function revisionVerb(action: string) {
  return action === "delete" ? "Before it was deleted" : action === "restore" ? "Before an earlier version was restored" : "Before it was changed";
}
