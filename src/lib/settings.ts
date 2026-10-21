import "server-only";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { IMAGE_SLOTS } from "./image-slots";

const desk = z.object({
  label: z.string(),
  email: z.string().default(""),
  phone: z.string().default(""),
  whatsapp: z.string().default(""),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #15803D");

const slide = z.object({
  title: z.string(),
  text: z.string(),
  /** An image slot name (hero-1) or an uploaded media id */
  image: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});

export const settingsSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    shortName: z.string().min(1),
    tagline: z.string(),
    about: z.string(),
    groupName: z.string(),
    groupUrl: z.string(),
    heritage: z.string(),
    /** One line shown on the home page and footer, e.g. "A business of the Kewalram Chanrai Group" */
    groupLine: z.string(),
  }),
  contact: z.object({
    phone: z.string(),
    whatsapp: z.string(),
    email: z.string(),
    address: z.string(),
    hours: z.string(),
  }),
  /** Enquiry desks. Categories point at one of these keys. Empty contacts fall back to the main contact. */
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
    slides: z.array(slide).max(6),
    heroTitle: z.string(),
    heroText: z.string(),
    fieldServiceTitle: z.string(),
    fieldServiceText: z.string(),
    showTestimonials: z.boolean(),
  }),
  /** Uploaded replacements for the named site images (slot name → media id). */
  images: z.record(z.string(), z.string()),
  seo: z.object({ title: z.string(), description: z.string() }),
  email: z.object({
    fromName: z.string(),
    fromAddress: z.string(),
    replyTo: z.string(),
    footerNote: z.string(),
    /** Heading over the brand logos at the foot of every email, e.g. "Authorised dealer for" */
    brandsLabel: z.string(),
    /** Mail server set in the dashboard. Empty host = use the SMTP_* server environment variables. */
    smtp: z.object({
      host: z.string(),
      port: z.number().int().min(1).max(65535),
      secure: z.boolean(),
      user: z.string(),
      /** Encrypted with AUTH_SECRET (see src/lib/secret-box.ts); never sent to the browser. */
      passEnc: z.string(),
    }),
  }),
  /** Who receives which emails. Staff can also opt in individually under Team. */
  alerts: z.object({
    /** Send new enquiries to the desk's own inbox (Company settings → Desks). */
    deskInbox: z.boolean(),
    /** Extra addresses that get every new enquiry, comma separated. */
    alsoEmail: z.string(),
    /** Send new testimonials waiting for approval to these addresses (empty = main contact email). */
    testimonialsTo: z.string(),
    /** Daily list of overdue enquiries. */
    overdueDigest: z.boolean(),
  }),
  enquiries: z.object({
    /** An open enquiry with no reply after this many hours is shown as overdue and goes in the daily reminder. */
    overdueHours: z.number().int().min(1).max(720),
    sendDailyReminder: z.boolean(),
  }),
  enyo: z.object({
    enabled: z.boolean(),
    name: z.string(),
    greeting: z.string(),
    tone: z.string(),
    model: z.string(),
    extraKnowledge: z.string(),
  }),
  translate: z.object({
    enabled: z.boolean(),
    /** Google Translate language codes offered in the picker */
    languages: z.array(z.string()),
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
export type Slide = z.infer<typeof slide>;

/** First-run values, from the company's business card. Everything is editable in the dashboard. */
export const defaultSettings: Settings = {
  company: {
    name: "Chanrai Nigeria Limited",
    shortName: "Chanrai Nigeria",
    tagline: "Construction machinery, CNG systems and forklifts. Supplied, installed and serviced where you work.",
    about:
      "Chanrai Nigeria supplies construction equipment, CNG and gas equipment, and electric forklifts to contractors, fleet operators, gas distributors and industry across Nigeria.\n\nOur technicians go to the machine: on the job site, at the station or in the warehouse. Sales, field service and genuine parts come from one team that knows the equipment.",
    groupName: "Kewalram Chanrai Group",
    groupUrl: "https://www.kewalramchanrai.com",
    heritage: "The Kewalram Chanrai Group has been in Nigeria since 1900.",
    groupLine: "A business of the Kewalram Chanrai Group",
  },
  contact: {
    phone: "09111867252",
    whatsapp: "09111867252",
    email: "cng@chanrainigeria.com",
    address: "122-132 Oshodi Apapa Expressway, Isolo, Lagos, Nigeria",
    hours: "Monday to Friday, 8:00 to 17:00",
  },
  desks: {
    sales: { label: "Equipment sales", email: "", phone: "", whatsapp: "" },
    service: { label: "Field service", email: "", phone: "", whatsapp: "" },
    parts: { label: "Parts", email: "", phone: "", whatsapp: "" },
    cng: { label: "CNG and gas", email: "cng@chanrainigeria.com", phone: "09111867252", whatsapp: "" },
  },
  social: { linkedin: "", facebook: "", instagram: "", x: "", youtube: "" },
  branding: {
    logoId: null,
    logoDarkId: null,
    faviconId: null,
    primary: "#15803D",
    accent: "#E8A317",
    showLoader: true,
  },
  home: {
    slides: [
      {
        title: "Machines that keep Nigeria building",
        text: "Excavators, loaders, dozers and graders, with technicians who come to your site.",
        image: "hero-1",
        ctaLabel: "See construction equipment",
        ctaHref: "/products/construction-equipment",
      },
      {
        title: "CNG stations, built and kept running",
        text: "Compressors, dispensers and gas skids, installed, commissioned and maintained on site.",
        image: "hero-2",
        ctaLabel: "See CNG and gas equipment",
        ctaHref: "/products/cng-gas-equipment",
      },
      {
        title: "Electric forklifts for busy warehouses",
        text: "Clean, quiet lithium iron phosphate trucks, with planned maintenance and parts.",
        image: "hero-3",
        ctaLabel: "See forklifts",
        ctaHref: "/products/forklifts-material-handling",
      },
    ],
    heroTitle: "Machines that keep Nigeria building, moving and fuelled",
    heroText: "Construction equipment, CNG station systems and electric forklifts, with sales, genuine parts and technicians who come to your site.",
    fieldServiceTitle: "We come to the machine",
    fieldServiceText:
      "Excavators don't drive to workshops and compressors don't leave the station. Book a visit and a technician comes to your site with the tools and parts the job needs.",
    showTestimonials: true,
  },
  images: {},
  seo: {
    title: "Chanrai Nigeria | Construction, CNG and forklift equipment",
    description:
      "Construction machinery, CNG and gas equipment, and electric forklifts in Nigeria. Sales, on-site service and genuine parts from Chanrai Nigeria, a business of the Kewalram Chanrai Group.",
  },
  email: {
    fromName: "Chanrai Nigeria",
    fromAddress: "",
    replyTo: "cng@chanrainigeria.com",
    footerNote: "Chanrai Nigeria Limited, a business of the Kewalram Chanrai Group",
    brandsLabel: "Authorised dealer for",
    smtp: { host: "", port: 587, secure: false, user: "", passEnc: "" },
  },
  alerts: { deskInbox: true, alsoEmail: "", testimonialsTo: "", overdueDigest: true },
  enquiries: { overdueHours: 24, sendDailyReminder: true },
  enyo: {
    enabled: true,
    name: "Enyo",
    greeting: "Hello, I'm Enyo, Chanrai Nigeria's assistant. Ask me about our machines, booking a technician, parts, or where to find us.",
    tone: "Warm, clear and professional. Short answers. Nigerian English is welcome.",
    model: "llama-3.3-70b-versatile",
    extraKnowledge: "",
  },
  translate: { enabled: true, languages: ["fr", "zh-CN", "hi", "ar", "pt", "ha", "yo", "ig"] },
  privacy: {
    controllerName: "Chanrai Nigeria Limited",
    dpoName: "",
    dpoEmail: "",
    lastUpdated: "2026-10-21",
  },
};

function mergeDeep<T>(base: T, over: unknown): T {
  if (over === null || typeof over !== "object" || Array.isArray(over)) return (over as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" && !Array.isArray(v) ? mergeDeep(b, v) : v;
  }
  return out as T;
}

/** Stored values layered over defaults, so settings added in later versions always have a value. */
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

/** A desk's contacts, falling back to the company's main contact for anything left empty. */
export function deskFor(settings: Settings, key: string): Desk & { key: string } {
  const k = settings.desks[key] ? key : "sales";
  const d = settings.desks[k] ?? Object.values(settings.desks)[0];
  return {
    key: k,
    label: d.label,
    email: d.email || settings.contact.email,
    phone: d.phone || settings.contact.phone,
    whatsapp: d.whatsapp || settings.contact.whatsapp,
  };
}

export function mediaUrl(id: string | null | undefined) {
  return id ? `/media/${id}` : null;
}

/** The URL for a named site image: the uploaded replacement if there is one, else the file in /public/images. */
export function imageUrl(settings: Settings, slotOrId: string) {
  if (settings.images[slotOrId]) return `/media/${settings.images[slotOrId]}`;
  const slot = IMAGE_SLOTS.find((s) => s.key === slotOrId);
  if (slot) return `/images/${slot.file}`;
  return /^[0-9a-f-]{36}$/i.test(slotOrId) ? `/media/${slotOrId}` : `/images/${slotOrId}`;
}
