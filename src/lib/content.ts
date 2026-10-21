import "server-only";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, schema } from "@/db";
import { pageDef } from "./content-registry";
import type { ContentField, ContentValue, ContentValues, PageDef } from "./content-types";
import { getSettings, imageUrl, type Settings } from "./settings";

const fieldsOf = (def: PageDef) => def.sections.flatMap((s) => s.fields);

/** Defaults for a page, straight from the registry. */
export function pageDefaults(def: PageDef): ContentValues {
  return Object.fromEntries(fieldsOf(def).map((f) => [f.key, f.default as ContentValue]));
}

/** Stored values checked against the field types, so a bad row can never break a page. */
export function cleanValues(def: PageDef, raw: unknown): ContentValues {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: ContentValues = {};
  for (const f of fieldsOf(def)) {
    const v = src[f.key];
    if (v === undefined) continue;
    if (f.type === "toggle") {
      if (typeof v === "boolean") out[f.key] = v;
    } else if (f.type === "list") {
      if (Array.isArray(v)) {
        out[f.key] = v
          .filter((it) => it && typeof it === "object")
          .slice(0, f.max ?? 50)
          .map((it) => Object.fromEntries(f.fields.map((sf) => [sf.key, String((it as Record<string, unknown>)[sf.key] ?? "")])));
      }
    } else if (typeof v === "string") {
      out[f.key] = v;
    }
  }
  return out;
}

const loadPage = unstable_cache(
  async (key: string) => (await db.query.pageContent.findFirst({ where: eq(schema.pageContent.page, key) }))?.data ?? {},
  ["page-content"],
  { tags: ["content"], revalidate: 300 },
);

export type PageContent = {
  /** Text value (falls back to the default when left empty) */
  t: (key: string) => string;
  /** Picture URL for an image field */
  img: (key: string) => string;
  list: (key: string) => Record<string, string>[];
  on: (key: string) => boolean;
  values: ContentValues;
};

export function contentAccessor(def: PageDef, stored: ContentValues, settings: Settings): PageContent {
  const defaults = pageDefaults(def);
  const field = (k: string): ContentField | undefined => fieldsOf(def).find((f) => f.key === k);
  const get = (k: string) => (stored[k] !== undefined && stored[k] !== "" ? stored[k] : defaults[k]);
  return {
    values: { ...defaults, ...stored },
    t: (k) => {
      const v = get(k);
      return typeof v === "string" ? v : "";
    },
    img: (k) => {
      const v = get(k);
      const f = field(k);
      const slot = f?.type === "image" ? f.default : "";
      return typeof v === "string" && v ? imageUrl(settings, v) : imageUrl(settings, slot);
    },
    list: (k) => {
      const v = get(k);
      return Array.isArray(v) && v.length ? v : ((defaults[k] as Record<string, string>[]) ?? []);
    },
    on: (k) => {
      const v = get(k);
      return typeof v === "boolean" ? v : !!defaults[k];
    },
  };
}

/** The editable content for one page, with defaults filled in. Never throws. */
export async function getContent(key: string): Promise<PageContent> {
  const def = pageDef(key);
  if (!def) throw new Error(`Unknown page "${key}". Add it to src/lib/content-registry.ts.`);
  const settings = await getSettings();
  let stored: ContentValues = {};
  try {
    stored = cleanValues(def, await loadPage(key));
  } catch (e) {
    console.error("[content]", e);
  }
  return contentAccessor(def, stored, settings);
}
