import "server-only";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";

const desk = z.object({
  label: z.string(),
  email: z.string().default(""),
  phone: z.string().default(""),
  whatsapp: z.string().default(""),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #1E7F55");

export const settingsSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    shortName: z.string().min(1),
    tagline: z.string(),
    about: z.string(),
    groupName: z.string(),
    groupUrl: z.string(),
    heritage: z.string(),
  }),
  contact: z.object({
    phone: z.string(),
    whatsapp: z.string(),
    email: z.string(),
    hours: z.string(),
  }),
  /** Enquiry desks. Categories point at one of these keys. */
  desks: z.record(z.string(), desk),
  social: z.object({
    linkedin: z.string(),
    facebook: z.string(),
    instagram: z.string(),
    x: z.string(),
    youtube: z.string(),
  }),
  branding: z.object({
    logoId: z.string().nullable(),
    logoDarkId: z.string().nullable(),
    faviconId: z.string().nullable(),
    primary: hex,
    accent: hex,
    showLoader: z.boolean(),
  }),
  home: z.object({
    heroTitle: z.string(),
    heroText: z.string(),
    fieldServiceTitle: z.string(),
    fieldServiceText: z.string(),
  }),
  seo: z.object({ title: z.string(), description: z.string() }),
  email: z.object({
    fromName: z.string(),
    fromAddress: z.string(),
    replyTo: z.string(),
    footerNote: z.string(),
  }),
  enyo: z.object({
    enabled: z.boolean(),
    name: z.string(),
    greeting: z.string(),
    tone: z.string(),
    model: z.string(),
    extraKnowledge: z.string(),
  }),
  privacy: z.object({
    controllerName: z.string(),
    dpoName: z.string(),
    dpoEmail: z.string(),
    lastUpdated: z.string(),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;
export type Desk = z.infer<typeof desk>;

/** First-run values. Everything here is editable in Admin → Settings. */
export const defaultSettings: Settings = {
  company: {
    name: "Chanrai Nigeria Limited",
    shortName: "Chanrai Nigeria",
    tagline: "Construction machinery, CNG systems and forklifts — supplied, installed and serviced where you work.",
    about:
      "Chanrai Nigeria supplies construction equipment, CNG and gas equipment, and electric forklifts to contractors, fleet operators, gas distributors and industry across Nigeria. Our technicians go to the machine: on the job site, in the warehouse or at the station.",
    groupName: "Kewalram Chanrai Group",
    groupUrl: "https://www.kewalramchanrai.com",
    heritage: "Part of the Kewalram Chanrai Group, in Nigeria since 1900.",
  },
  contact: {
    phone: "",
    whatsapp: "",
    email: "",
    hours: "Monday to Friday, 8:00 to 17:00",
  },
  desks: {
    sales: { label: "Equipment sales", email: "", phone: "", whatsapp: "" },
    service: { label: "Field service", email: "", phone: "", whatsapp: "" },
    parts: { label: "Parts", email: "", phone: "", whatsapp: "" },
    cng: { label: "CNG & gas", email: "cng@chanrainigeria.com", phone: "09111867252", whatsapp: "" },
  },
  social: { linkedin: "", facebook: "", instagram: "", x: "", youtube: "" },
  branding: {
    logoId: null,
    logoDarkId: null,
    faviconId: null,
    primary: "#1E7F55",
    accent: "#E8A317",
    showLoader: true,
  },
  home: {
    heroTitle: "Machines that keep Nigeria building, moving and fuelled",
    heroText:
      "Construction equipment, CNG station systems and electric forklifts — with sales, genuine parts and technicians who come to your site.",
    fieldServiceTitle: "We come to the machine",
    fieldServiceText:
      "Excavators don't drive to workshops and compressors don't leave the station. Book a visit and a technician comes to your site with the tools and parts the job needs.",
  },
  seo: {
    title: "Chanrai Nigeria — construction, CNG and forklift equipment",
    description:
      "Construction machinery, CNG and gas equipment, and electric forklifts in Nigeria. Sales, on-site service and genuine parts from Chanrai Nigeria, part of the Kewalram Chanrai Group.",
  },
  email: {
    fromName: "Chanrai Nigeria",
    fromAddress: "",
    replyTo: "",
    footerNote: "Chanrai Nigeria Limited · Part of the Kewalram Chanrai Group",
  },
  enyo: {
    enabled: true,
    name: "Enyo",
    greeting:
      "Hello, I'm Enyo, Chanrai Nigeria's assistant. Ask me about our machines, booking a technician, parts, or where to find us.",
    tone: "Warm, clear and professional. Short answers. Nigerian English is welcome.",
    model: "llama-3.3-70b-versatile",
    extraKnowledge: "",
  },
  privacy: {
    controllerName: "Chanrai Nigeria Limited",
    dpoName: "",
    dpoEmail: "",
    lastUpdated: new Date().toISOString().slice(0, 10),
  },
};

function mergeDeep<T>(base: T, over: unknown): T {
  if (over === null || typeof over !== "object" || Array.isArray(over)) return (over as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" ? mergeDeep(b, v) : v;
  }
  return out as T;
}

/** Stored values layered over defaults, so new settings added in later versions always have a value. */
export function normaliseSettings(raw: unknown): Settings {
  const merged = mergeDeep(defaultSettings, raw ?? {});
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultSettings;
}

const cachedSettings = unstable_cache(
  async (): Promise<Settings> => {
    const row = await db.query.siteSettings.findFirst({ where: eq(schema.siteSettings.id, 1) });
    return normaliseSettings(row?.data);
  },
  ["site-settings"],
  { tags: ["settings"], revalidate: 300 },
);

/** Settings with defaults; a database hiccup falls back to defaults without being cached. */
export async function getSettings(): Promise<Settings> {
  try {
    return await cachedSettings();
  } catch (e) {
    console.error("[settings]", e);
    return defaultSettings;
  }
}

export function deskFor(settings: Settings, key: string): Desk & { key: string } {
  const d = settings.desks[key] ?? settings.desks.sales ?? Object.values(settings.desks)[0];
  return { key: settings.desks[key] ? key : "sales", ...d };
}

export function mediaUrl(id: string | null | undefined) {
  return id ? `/media/${id}` : null;
}
