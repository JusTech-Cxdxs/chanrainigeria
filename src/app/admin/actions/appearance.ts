"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { snapshot } from "@/lib/history";
import { IMAGE_SLOTS } from "@/lib/image-slots";
import { getSettings, type Settings } from "@/lib/settings";

const UUID = /^[0-9a-f-]{36}$/i;
const LINK = /^(\/(?![/\\])[^\s<>"']*|https:\/\/[^\s<>"']+)$/;

async function editor() {
  return requireAdmin("pages");
}

async function store(next: Settings, actorId: string, label: string) {
  await snapshot("settings", "1", label, "update", actorId);
  await db.insert(schema.siteSettings).values({ id: 1, data: next }).onConflictDoUpdate({ target: schema.siteSettings.id, set: { data: next } });
  revalidateTag("settings");
  revalidatePath("/", "layout");
}

const back = (key: "saved" | "error", msg: string, hash = "") => redirect(`/admin/images?${key}=${encodeURIComponent(msg)}${hash || "#slides"}`);

/** The whole slider arrives as JSON from the slides editor: order, text, picture and button for each slide. */
export async function saveSlides(f: FormData) {
  const user = await editor();
  let raw: unknown;
  try {
    raw = JSON.parse(String(f.get("slides") ?? "[]"));
  } catch {
    back("error", "The slider couldn't be read. Refresh the page and try again.");
  }
  const list = Array.isArray(raw) ? raw.slice(0, 6) : [];
  const slides: Settings["home"]["slides"] = [];
  for (const [k, it] of list.entries()) {
    const x = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
    const str = (key: string) => String(x[key] ?? "").trim();
    const title = str("title");
    if (!title) back("error", `Slide ${k + 1} needs a headline.`);
    const img = str("image");
    const href = str("ctaHref") || "/products";
    if (!LINK.test(href)) back("error", `Slide ${k + 1}: the button link must be a page on this site starting with / or a full address starting with https://`);
    slides.push({
      title: title.slice(0, 120),
      text: str("text").slice(0, 260),
      image: UUID.test(img) || IMAGE_SLOTS.some((s) => s.key === img) ? img : `hero-${(k % 3) + 1}`,
      ctaLabel: str("ctaLabel").slice(0, 40) || "Learn more",
      ctaHref: href.slice(0, 300),
    });
  }
  if (!slides.length) back("error", "Keep at least one slide.");
  const cur = await getSettings();
  await store({ ...cur, home: { ...cur.home, slides } }, user.id, "Home slider");
  await audit(user.id, "update", "settings", `Updated the home slider (${slides.length} slide${slides.length === 1 ? "" : "s"})`);
  back("saved", "Slider saved. The home page shows it now.");
}

/** Named pictures: each field holds a library file id, or nothing for the picture the site ships with. */
export async function saveSlotImages(f: FormData) {
  const user = await editor();
  const cur = await getSettings();
  const images = { ...cur.images };
  let changed = 0;
  for (const slot of IMAGE_SLOTS) {
    const v = String(f.get(`img_${slot.key}`) ?? "").trim();
    const next = UUID.test(v) ? v : "";
    if ((images[slot.key] ?? "") === next) continue;
    changed++;
    if (next) images[slot.key] = next;
    else delete images[slot.key];
  }
  if (!changed) back("saved", "No changes to save.", "#images");
  await store({ ...cur, images }, user.id, "Site pictures");
  await audit(user.id, "update", "image", `Changed ${changed} site picture${changed === 1 ? "" : "s"}`);
  back("saved", `${changed} picture${changed === 1 ? "" : "s"} updated.`, "#images");
}
