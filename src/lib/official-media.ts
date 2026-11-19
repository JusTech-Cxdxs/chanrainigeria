// Official manufacturer media shipped with the site (public/official): studio pictures, working photos,
// banners, brochures with their specification sheet, and films. The list is in official-media.json, written
// by the media build from the manufacturers' own product pages (see docs/OFFICIAL-MEDIA.md).
// A picture or brochure uploaded in the Dashboard always wins over these.
import data from "./official-media.json";

export type Brochure = { href: string; kb: number; sheet?: string; sheetSize?: number[]; label?: string };
export type OfficialModel = {
  brand: string;
  /** The manufacturer's page the media came from */
  source: string;
  /** Studio pictures on a clean background; several of them are angles round the machine */
  studio: { src: string; w: number; h: number }[];
  /** Working photos */
  gallery: string[];
  banner?: string;
  brochure?: Brochure;
};
export type TypePhoto = { src: string; caption: string; brand: string };
export type OfficialType = { gallery: TypePhoto[]; brochures?: Brochure[] };
export type Film = { youtube?: string; mp4?: string; poster?: string; title: string; by: string };
export type OfficialLine = { films: Film[]; brochures?: Brochure[] };

const d = data as unknown as { models: Record<string, OfficialModel>; types: Record<string, OfficialType>; lines: Record<string, OfficialLine> };

/** Models whose studio pictures show a sister model of the same series (same truck, another capacity). */
const SISTER = new Set(["byd-ecb25", "byd-ecb27", "byd-ecb35", "byd-ecb60", "byd-ecb80", "byd-rtr20"]);

export const officialModel = (slug: string): OfficialModel | null => d.models[slug] ?? null;
export const officialType = (slug: string): OfficialType | null => d.types[slug] ?? null;
export const officialLine = (slug: string): OfficialLine | null => d.lines[slug] ?? null;
export const showsSister = (slug: string) => SISTER.has(slug);

/** A studio picture: shown whole on a white panel, never cropped. */
export const isStudio = (src: string | null | undefined) => !!src && /^\/official\/[\w-]+\/[\w-]+\/(?:studio|view-\d+)\.webp$/.test(src);

/** "1.2 MB" / "180 KB" */
export const fileSize = (kb: number) => (kb >= 1000 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
