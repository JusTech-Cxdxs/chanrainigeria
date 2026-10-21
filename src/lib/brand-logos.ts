// Logos for the brands the site ships with. An uploaded logo (Dashboard → Images or Brands) always
// wins; until then these files in /public/brand/logos are used, so the brands strip never shows plain text.
export const BUNDLED_LOGOS = ["liugong", "sopan", "byd"] as const;

/** The logo URL for a brand, relative to the site, or null when there is none. */
export function brandLogo(b: { slug?: string | null; logoId?: string | null }) {
  if (b.logoId) return `/media/${b.logoId}`;
  if (b.slug && (BUNDLED_LOGOS as readonly string[]).includes(b.slug)) return `/brand/logos/${b.slug}.png`;
  return null;
}

/** Width ÷ height of the bundled files, so compact logos (BYD) can be drawn a little taller than wide ones. */
const ASPECT: Record<string, number> = { liugong: 784 / 200, sopan: 661 / 200, byd: 359 / 200 };

/**
 * A height multiplier that gives logos of different shapes a similar visual weight (1 for wide
 * wordmarks, up to 1.35 for compact badges). Uploaded logos use 1 unless their shape is known.
 */
export function logoScale(b: { slug?: string | null; logoId?: string | null }, aspect?: number | null) {
  const a = aspect ?? (!b.logoId && b.slug ? ASPECT[b.slug] : undefined);
  if (!a) return 1;
  return Math.min(1.35, Math.max(1, Math.sqrt(3.2 / a)));
}

/** Width ÷ height used to size a logo's box so the logo fills it edge to edge (3 when unknown). */
export function logoAspect(b: { slug?: string | null; logoId?: string | null }, aspect?: number | null) {
  return aspect ?? (!b.logoId && b.slug ? ASPECT[b.slug] : undefined) ?? 3;
}
