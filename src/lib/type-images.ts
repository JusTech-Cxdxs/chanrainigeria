// Pictures shipped with the site for machine types (public/images/types/<slug>.jpg). An uploaded picture
// (Dashboard → Images) always wins; until then these are used instead of the line drawing.
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
  "rollers-compactors",
  "mining-trucks",
  "four-wheel-counterbalance-forklifts",
  "electric-pallet-trucks",
  "electric-stackers",
  "electric-reach-trucks",
  "electric-tow-tractors",
]);

/** Shipped pictures that show one particular model (the model name is visible on the machine). */
const SHOWS_MODEL: Record<string, string> = { "four-wheel-counterbalance-forklifts": "byd-ecb25" };

export function bundledTypeImage(slug: string): string | null {
  return BUNDLED.has(slug) ? `/images/types/${slug}.jpg` : null;
}

/** The picture for a machine type: uploaded, else shipped, else null (the line drawing is shown). */
export function familyImage(f: { slug: string; imageId?: string | null }): string | null {
  return mediaUrl(f.imageId) ?? bundledTypeImage(f.slug);
}

/** A model without its own photos borrows its type's picture, unless that picture shows a different model. */
export function modelFallbackImage(f: { slug: string; imageId?: string | null }, modelSlug: string): string | null {
  if (f.imageId) return mediaUrl(f.imageId);
  const lock = SHOWS_MODEL[f.slug];
  if (lock && lock !== modelSlug) return null;
  return bundledTypeImage(f.slug);
}
