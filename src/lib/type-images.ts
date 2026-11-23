// Pictures shipped with the site for machine types (public/images/types/<slug>.jpg, made from the
// manufacturers' own photos, see docs/OFFICIAL-MEDIA.md), models
// (public/images/models/<slug>.jpg) and the starter articles (public/images/news/<slug>.jpg).
// An uploaded picture (Dashboard → Images, the model's page, or the article) always wins.
import { officialModel } from "./official-media";
import { mediaUrl } from "./settings";

const BUNDLED = new Set([
  "station-solutions",
  "hydraulic-booster-compressors",
  "reciprocating-compressors",
  "cng-dispensers",
  "cascades-storage",
  "gas-utility-skids",
  "cng-tube-trailer-skids",
  "excavators",
  "wheel-loaders",
  "bulldozers",
  "motor-graders",
  "backhoe-loaders",
  "rollers",
  "mining-trucks",
  "el-pro-counterbalance-forklifts",
  "g-series-counterbalance-forklifts",
  "heavy-duty-counterbalance-forklifts",
  "pallet-trucks",
  "stackers",
  "reach-trucks",
  "tow-tractors",
]);

/** Models with their own shipped photo (none now: the manufacturers' own pictures are used). */
const MODEL_PHOTOS = new Set<string>([]);

/** Starter articles with a shipped cover. */
const NEWS_COVERS = new Set(["prepare-site-for-technician-visit", "wheel-loader-daily-checks", "electric-forklift-battery-care", "planning-a-cng-station"]);

export function bundledTypeImage(slug: string): string | null {
  return BUNDLED.has(slug) ? `/images/types/${slug}.jpg` : null;
}

export function bundledModelImage(slug: string): string | null {
  return MODEL_PHOTOS.has(slug) ? `/images/models/${slug}.jpg` : null;
}

/** The picture for a machine type: uploaded, else shipped, else null (the line drawing is shown). */
export function familyImage(f: { slug: string; imageId?: string | null }): string | null {
  return mediaUrl(f.imageId) ?? bundledTypeImage(f.slug);
}

/**
 * A model without uploaded photos: its own shipped photo, else its type's picture. Shipped type pictures
 * carry no model name, so every model of the type can borrow one.
 */
export function modelFallbackImage(f: { slug: string; imageId?: string | null }, modelSlug: string): string | null {
  return modelPictures(f, modelSlug)[0] ?? null;
}

/**
 * Every shipped picture of a model: the manufacturer's studio pictures, then its working photos. A model
 * the manufacturer shows none of uses our own photo of it, else borrows its type's picture.
 */
export function modelPictures(f: { slug: string; imageId?: string | null }, modelSlug: string): string[] {
  const o = officialModel(modelSlug);
  const official = [...(o?.studio.map((s) => s.src) ?? []), ...(o?.gallery ?? [])];
  if (official.length) return official;
  const own = bundledModelImage(modelSlug);
  if (own) return [own];
  const t = familyImage(f);
  return t ? [t] : [];
}

/** An article's cover: uploaded, else shipped, else null. */
export function postCover(p: { slug: string; coverId?: string | null }): string | null {
  return mediaUrl(p.coverId) ?? (NEWS_COVERS.has(p.slug) ? `/images/news/${p.slug}.jpg` : null);
}
