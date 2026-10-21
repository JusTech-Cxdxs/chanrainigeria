"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { testConnection } from "@/lib/ai";
import { snapshot } from "@/lib/history";
import { clearEnyoCache } from "@/lib/enyo";
import { saveUpload } from "@/lib/media";
import { getSettings, settingsSchema, type Settings } from "@/lib/settings";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
/** Outside links must be plain https web addresses; anything else is dropped. */
const link = (v: string) => (/^https:\/\/[^\s"'<>]+$/i.test(v) ? v.slice(0, 300) : "");
const IMAGE = ["image/png", "image/svg+xml", "image/webp", "image/jpeg", "image/x-icon", "image/vnd.microsoft.icon"];

/** WCAG contrast of white text on a colour — brand buttons use white text. */
function contrastWithWhite(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return 1.05 / (L + 0.05);
}

export async function saveSettings(f: FormData) {
  const user = await requireAdmin("settings");
  const cur = await getSettings();
  const fail = (msg: string) => redirect(`/admin/settings?error=${encodeURIComponent(msg)}`);

  const uploads: Partial<Record<"logoId" | "logoDarkId" | "faviconId", string | null>> = {};
  for (const key of ["logoId", "logoDarkId", "faviconId"] as const) {
    const file = f.get(key);
    if (file instanceof File && file.size) {
      const r = await saveUpload(file, { allowed: IMAGE, alt: key === "faviconId" ? "Browser icon" : "Logo", folder: "Brands and logos", logo: key !== "faviconId" });
      if (!r.ok) fail(r.error);
      else uploads[key] = r.id;
    } else if (f.get(`remove_${key}`) === "on") uploads[key] = null;
  }

  const desks: Settings["desks"] = {};
  for (const key of Object.keys(cur.desks)) {
    desks[key] = {
      label: s(f, `desk_${key}_label`) || cur.desks[key].label,
      email: s(f, `desk_${key}_email`),
      phone: s(f, `desk_${key}_phone`),
      whatsapp: s(f, `desk_${key}_whatsapp`),
    };
  }

  const next: Settings = {
    company: {
      name: s(f, "company_name"),
      shortName: s(f, "company_shortName") || s(f, "company_name"),
      tagline: s(f, "company_tagline"),
      about: s(f, "company_about"),
      groupName: s(f, "company_groupName"),
      groupUrl: link(s(f, "company_groupUrl")),
      heritage: s(f, "company_heritage"),
      groupLine: s(f, "company_groupLine"),
    },
    contact: {
      phone: s(f, "contact_phone"),
      whatsapp: s(f, "contact_whatsapp"),
      email: s(f, "contact_email"),
      address: s(f, "contact_address"),
      hours: s(f, "contact_hours"),
    },
    desks,
    social: {
      linkedin: link(s(f, "social_linkedin")),
      facebook: link(s(f, "social_facebook")),
      instagram: link(s(f, "social_instagram")),
      x: link(s(f, "social_x")),
      youtube: link(s(f, "social_youtube")),
    },
    branding: {
      logoId: uploads.logoId !== undefined ? uploads.logoId : cur.branding.logoId,
      logoDarkId: uploads.logoDarkId !== undefined ? uploads.logoDarkId : cur.branding.logoDarkId,
      faviconId: uploads.faviconId !== undefined ? uploads.faviconId : cur.branding.faviconId,
      primary: s(f, "branding_primary") || cur.branding.primary,
      accent: s(f, "branding_accent") || cur.branding.accent,
      showLoader: f.get("branding_showLoader") === "on",
    },
    home: {
      slides: cur.home.slides,
      showTestimonials: f.get("home_showTestimonials") === "on",
      heroTitle: s(f, "home_heroTitle") || cur.home.heroTitle,
      heroText: s(f, "home_heroText") || cur.home.heroText,
      fieldServiceTitle: s(f, "home_fieldServiceTitle"),
      fieldServiceText: s(f, "home_fieldServiceText"),
    },
    images: cur.images,
    seo: { title: s(f, "seo_title"), description: s(f, "seo_description") },
    enquiries: {
      overdueHours: Math.min(720, Math.max(1, Number(f.get("enquiries_overdueHours")) || cur.enquiries.overdueHours)),
      sendDailyReminder: f.get("enquiries_sendDailyReminder") === "on",
    },
    translate: {
      enabled: f.get("translate_enabled") === "on",
      languages: f.getAll("translate_languages").map(String).filter((l) => /^[a-z]{2}(-[A-Z]{2})?$/.test(l)),
    },
    // Email and alerts have their own page (Email and alerts), so they are kept as they are here.
    email: cur.email,
    alerts: cur.alerts,
    enyo: {
      enabled: f.get("enyo_enabled") === "on",
      name: s(f, "enyo_name") || "Enyo",
      greeting: s(f, "enyo_greeting"),
      tone: s(f, "enyo_tone"),
      model: s(f, "enyo_model").slice(0, 120),
      extraKnowledge: String(f.get("enyo_extraKnowledge") ?? "").trim().slice(0, 6000),
    },
    privacy: {
      controllerName: s(f, "privacy_controllerName"),
      dpoName: s(f, "privacy_dpoName"),
      dpoEmail: s(f, "privacy_dpoEmail"),
      lastUpdated: s(f, "privacy_lastUpdated") || cur.privacy.lastUpdated,
    },
  };

  const parsed = settingsSchema.safeParse(next);
  if (!parsed.success) fail(parsed.error.issues.map((i) => `${i.path.join(" ")}: ${i.message}`).join("; "));
  if (contrastWithWhite(next.branding.primary) < 4.5)
    fail("That brand colour is too light for white button text to be readable. Choose a darker shade.");

  await snapshot("settings", "1", "Company settings", "update", user.id);
  await db
    .insert(schema.siteSettings)
    .values({ id: 1, data: next })
    .onConflictDoUpdate({ target: schema.siteSettings.id, set: { data: next } });

  const changed = (Object.keys(next) as (keyof Settings)[]).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(cur[k]));
  await audit(user.id, "update", "settings", changed.length ? `Changed settings: ${changed.join(", ")}` : "Saved settings (no changes)");
  revalidateTag("settings");
  revalidatePath("/", "layout");
  clearEnyoCache();
  redirect("/admin/settings?saved=Settings%20saved.%20The%20website%20is%20updated.");
}

/** Clears every cached page and query, e.g. after loading data straight into the database. */
export async function refreshSiteCache() {
  const user = await requireAdmin("settings");
  for (const tag of ["settings", "catalogue", "posts", "branches"]) revalidateTag(tag);
  revalidatePath("/", "layout");
  clearEnyoCache();
  await audit(user.id, "refresh", "cache", "Refreshed the website cache");
  redirect("/admin/settings?saved=The%20website%20now%20shows%20the%20latest%20data.");
}

/** "Test connection" on Company settings → Enyo: one tiny request to the configured models. */
export async function testAiConnection() {
  const user = await requireAdmin("settings");
  const s = await getSettings();
  const r = await testConnection(s.enyo.model);
  await audit(user.id, "test", "ai", r.ok ? "AI connection test passed" : "AI connection test failed");
  return r;
}
