"use server";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { cleanValues, pageDefaults } from "@/lib/content";
import { pageDef } from "@/lib/content-registry";
import type { ContentField, ContentValues, LinkField, PageDef } from "@/lib/content-types";
import { clearEnyoCache } from "@/lib/enyo";
import { snapshot } from "@/lib/history";
import { IMAGE_SLOTS } from "@/lib/image-slots";

/** A site path (/contact, /products?x=1#y) or a full https:// address. Empty means "use the original". */
const LINK = /^(\/(?![/\\])[^\s<>"']*|https:\/\/[^\s<>"']+)$/;
const UUID = /^[0-9a-f-]{36}$/i;

function problem(def: PageDef, values: ContentValues): string | null {
  const checkLink = (f: LinkField, v: unknown, where: string) =>
    typeof v === "string" && v && !LINK.test(v) ? `${where}: "${v.slice(0, 60)}" isn't a valid link. Use a page on this site starting with / or a full address starting with https://` : null;
  const checkImage = (v: unknown, where: string) =>
    typeof v === "string" && v && !UUID.test(v) && !IMAGE_SLOTS.some((s) => s.key === v) ? `${where}: that picture couldn't be found. Choose it again.` : null;
  for (const sec of def.sections) {
    for (const f of sec.fields) {
      const v = values[f.key];
      if (f.type === "link") {
        const p = checkLink(f, v, f.label);
        if (p) return p;
      } else if (f.type === "image") {
        const p = checkImage(v, f.label);
        if (p) return p;
      } else if (f.type === "list" && Array.isArray(v)) {
        if (f.min && v.length < f.min) return `${f.label}: keep at least ${f.min}.`;
        for (const [i, item] of v.entries()) {
          for (const sf of f.fields) {
            const where = `${f.label}, ${f.itemLabel.toLowerCase()} ${i + 1}, ${sf.label.toLowerCase()}`;
            const p = sf.type === "link" ? checkLink(sf, item[sf.key], where) : sf.type === "image" ? checkImage(item[sf.key], where) : null;
            if (p) return p;
          }
        }
      }
    }
  }
  return null;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Only what differs from the original wording is stored, so improving a default later reaches every page. */
function diff(def: PageDef, values: ContentValues) {
  const defaults = pageDefaults(def);
  const out: ContentValues = {};
  const fields: ContentField[] = def.sections.flatMap((s) => s.fields);
  for (const f of fields) {
    const v = values[f.key];
    if (v === undefined) continue;
    if (f.type === "list" && Array.isArray(v)) {
      const trimmed = v.map((it) => Object.fromEntries(Object.entries(it).map(([k, x]) => [k, x.trim()])));
      if (!same(trimmed, defaults[f.key])) out[f.key] = trimmed;
    } else if (typeof v === "string") {
      const t = f.type === "markdown" || f.type === "textarea" ? v.replace(/\r\n/g, "\n").trim() : v.trim();
      if (t !== "" && !same(t, defaults[f.key])) out[f.key] = t;
    } else if (!same(v, defaults[f.key])) {
      out[f.key] = v;
    }
  }
  return out;
}

function refresh(def: PageDef) {
  revalidateTag("content");
  if (def.path) revalidatePath(def.path.split("?")[0]);
  revalidatePath("/", "layout");
  clearEnyoCache();
}

export async function savePage(key: string, f: FormData) {
  const user = await requireAdmin("pages");
  const def = pageDef(key);
  if (!def) redirect("/admin/pages?error=That%20page%20doesn%27t%20exist.");
  const back = `/admin/pages/${key}`;
  let parsed: unknown;
  try {
    parsed = JSON.parse(String(f.get("values") ?? "{}"));
  } catch {
    redirect(`${back}?error=${encodeURIComponent("The changes couldn't be read. Refresh the page and try again.")}`);
  }
  const values = cleanValues(def!, parsed);
  const p = problem(def!, values);
  if (p) redirect(`${back}?error=${encodeURIComponent(p)}`);
  const cur = await db.query.pageContent.findFirst({ where: eq(schema.pageContent.page, key) });
  const data = diff(def!, values);
  // Pictures are changed under Images, so this form never overwrites them.
  const storedData = (cur?.data ?? {}) as Record<string, unknown>;
  for (const fld of def!.sections.flatMap((x) => x.fields)) {
    if (fld.type !== "image") continue;
    delete data[fld.key];
    if (typeof storedData[fld.key] === "string" && storedData[fld.key]) data[fld.key] = storedData[fld.key] as string;
  }
  if (cur && same(cur.data as ContentValues, data)) redirect(`${back}?saved=${encodeURIComponent("No changes to save.")}`);
  await snapshot("page", key, def!.label, "update", user.id);
  await db
    .insert(schema.pageContent)
    .values({ page: key, data, updatedById: user.id })
    .onConflictDoUpdate({ target: schema.pageContent.page, set: { data, updatedById: user.id, updatedAt: new Date() } });
  const changed = Object.keys(data).length;
  await audit(user.id, "update", "page", `Edited ${def!.label} (${changed} field${changed === 1 ? "" : "s"} differ from the original)`, key);
  refresh(def!);
  redirect(`${back}?saved=${encodeURIComponent(`Saved. ${def!.path ? "The page on the site now shows your changes." : "Your changes are live."}`)}`);
}

/** Put every field on a page back to the original wording. The current version stays in History. */
export async function resetPage(key: string) {
  const user = await requireAdmin("pages");
  const def = pageDef(key);
  if (!def) redirect("/admin/pages");
  await snapshot("page", key, def!.label, "update", user.id);
  await db.delete(schema.pageContent).where(eq(schema.pageContent.page, key));
  await audit(user.id, "update", "page", `Put ${def!.label} back to the original wording`, key);
  refresh(def!);
  redirect(`/admin/pages/${key}?saved=${encodeURIComponent("Every field is back to the original. You can undo this from the page's history.")}`);
}
