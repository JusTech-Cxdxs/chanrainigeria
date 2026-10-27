// Pictures shipped with the site for machine types (public/images/types/<slug>.jpg), models
// (public/images/models/<slug>.jpg) and the starter articles (public/images/news/<slug>.jpg).
// An uploaded picture (Dashboard → Images, the model's page, or the article) always wins.
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
  "skid-steer-loaders",
  "backhoe-loaders",
  "rollers",
  "mining-trucks",
  "three-wheel-counterbalance-forklifts",
  "four-wheel-counterbalance-forklifts",
  "heavy-duty-counterbalance-forklifts",
  "pallet-trucks",
  "stackers",
  "reach-trucks",
  "tow-tractors",
]);

/** Models with their own shipped photo; the model name is on the machine in the photo. */
const MODEL_PHOTOS = new Set([
  "liugong-365a",
  "liugong-375a",
  "liugong-777a",
  "byd-ecb16",
  "byd-ecb18",
  "byd-ecb20s",
  "byd-ecb25",
  "byd-ecb27",
  "byd-ecb60",
  "byd-ecb70",
  "byd-ecb80",
]);

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
  return bundledModelImage(modelSlug) ?? familyImage(f);
}

/** An article's cover: uploaded, else shipped, else null. */
export function postCover(p: { slug: string; coverId?: string | null }): string | null {
  return mediaUrl(p.coverId) ?? (NEWS_COVERS.has(p.slug) ? `/images/news/${p.slug}.jpg` : null);
}
