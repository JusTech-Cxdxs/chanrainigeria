"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { IMAGE_SLOTS } from "@/lib/image-slots";
import { saveUpload } from "@/lib/media";
import { getSettings, type Settings } from "@/lib/settings";

const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

async function editor() {
  const user = await requireAdmin("pages");
  return user;
}

async function store(next: Settings) {
  await db.insert(schema.siteSettings).values({ id: 1, data: next }).onConflictDoUpdate({ target: schema.siteSettings.id, set: { data: next } });
  revalidateTag("settings");
  revalidatePath("/", "layout");
}

export async function saveSlides(f: FormData) {
  const user = await editor();
  const cur = await getSettings();
  const slides: Settings["home"]["slides"] = [];
  for (let k = 0; k < 6; k++) {
    const title = s(f, `slide_${k}_title`);
    if (!title || f.get(`slide_${k}_remove`) === "on") continue;
    let image = s(f, `slide_${k}_image`) || `hero-${(k % 3) + 1}`;
    const file = f.get(`slide_${k}_file`);
    if (file instanceof File && file.size) {
      const r = await saveUpload(file, { allowed: IMAGES, alt: title });
      if (!r.ok) redirect(`/admin/appearance?error=${encodeURIComponent(r.error)}`);
      image = r.id;
    }
    const href = s(f, `slide_${k}_ctaHref`) || "/products";
    slides.push({
      title: title.slice(0, 120),
      text: s(f, `slide_${k}_text`).slice(0, 260),
      image,
      ctaLabel: s(f, `slide_${k}_ctaLabel`).slice(0, 40) || "Learn more",
      // Only links inside the site or to https pages.
      ctaHref: /^(\/(?!\/)|https:\/\/)/.test(href) ? href.slice(0, 300) : "/products",
    });
  }
  if (!slides.length) redirect("/admin/appearance?error=Keep%20at%20least%20one%20slide.");
  await store({ ...cur, home: { ...cur.home, slides } });
  await audit(user.id, "update", "settings", `Updated the home slider (${slides.length} slides)`);
  redirect("/admin/appearance?saved=Slider%20saved.");
}

export async function replaceSlotImage(slot: string, f: FormData) {
  const user = await editor();
  const def = IMAGE_SLOTS.find((x) => x.key === slot);
  if (!def) redirect("/admin/appearance?error=Unknown%20image");
  const file = f.get("file");
  if (!(file instanceof File) || !file.size) redirect("/admin/appearance?error=Choose%20a%20picture%20first.");
  const r = await saveUpload(file as File, { allowed: IMAGES, alt: def!.label });
  if (!r.ok) redirect(`/admin/appearance?error=${encodeURIComponent(r.error)}`);
  const cur = await getSettings();
  await store({ ...cur, images: { ...cur.images, [slot]: r.ok ? r.id : "" } });
  await audit(user.id, "update", "image", `Replaced the picture "${def!.label}"`);
  redirect(`/admin/appearance?saved=${encodeURIComponent(`${def!.label} updated.`)}#images`);
}

export async function resetSlotImage(slot: string) {
  const user = await editor();
  const def = IMAGE_SLOTS.find((x) => x.key === slot);
  const cur = await getSettings();
  const images = { ...cur.images };
  delete images[slot];
  await store({ ...cur, images });
  await audit(user.id, "update", "image", `Restored the default picture "${def?.label ?? slot}"`);
  redirect(`/admin/appearance?saved=${encodeURIComponent("Default picture restored.")}#images`);
}
