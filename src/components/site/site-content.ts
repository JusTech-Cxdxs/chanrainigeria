import "server-only";
import type { Metadata } from "next";
import { getContent, type PageContent } from "@/lib/content";
import { pageDef } from "@/lib/content-registry";
import { getSettings, type Settings } from "@/lib/settings";
import { fill, type Labels, type Vars } from "./fill";

/** The words every page understands, from Company settings. See the note in content-registry.ts. */
export function siteVars(s: Settings): Vars {
  return { company: s.company.shortName, companyFull: s.company.name, group: s.company.groupName, enyo: s.enyo.name };
}

export type SiteContent = PageContent & {
  /** Text with page-specific words filled in, e.g. c.f("servicesTitle", { line: "forklifts" }) */
  f: (key: string, vars?: Vars) => string;
  /** Every text and link field of the page, filled, for handing to a client component. */
  labels: () => Labels;
  settings: Settings;
};

/**
 * getContent() with {company}, {enyo} and the other site-wide words already filled in.
 * Use this on public pages; pass c.labels() to client components.
 */
export async function siteContent(key: string): Promise<SiteContent> {
  const [c, s] = await Promise.all([getContent(key), getSettings()]);
  const base = siteVars(s);
  const t = (k: string) => fill(c.t(k), base);
  return {
    ...c,
    settings: s,
    t,
    f: (k, vars = {}) => fill(c.t(k), { ...base, ...vars }),
    list: (k) => c.list(k).map((it) => Object.fromEntries(Object.entries(it).map(([a, b]) => [a, fill(b, base)]))),
    labels: () => {
      const def = pageDef(key);
      const out: Labels = {};
      for (const f of def?.sections.flatMap((x) => x.fields) ?? []) {
        if (f.type === "text" || f.type === "textarea" || f.type === "markdown" || f.type === "link") out[f.key] = t(f.key);
      }
      return out;
    },
  };
}

/** generateMetadata() for a page with the standard "Search engines" fields. */
export async function pageMetadata(key: string): Promise<Metadata> {
  const c = await siteContent(key);
  const title = c.t("metaTitle");
  const description = c.t("metaDescription");
  return { ...(title ? { title } : {}), ...(description ? { description } : {}) };
}
