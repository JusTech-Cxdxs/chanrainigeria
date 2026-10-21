import { redirect } from "next/navigation";
import { replaceSlotImage, resetSlotImage, saveSlides } from "@/app/admin/actions/appearance";
import { AdminHead, Check, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { IMAGE_SLOTS } from "@/lib/image-slots";
import { getSettings, imageUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Appearance({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin("pages");
  const s = await getSettings();
  const slides = [...s.home.slides];
  while (slides.length < Math.min(6, s.home.slides.length + 1)) slides.push({ title: "", text: "", image: `hero-${(slides.length % 3) + 1}`, ctaLabel: "", ctaHref: "" });
  const heroSlots = IMAGE_SLOTS.filter((x) => x.key.startsWith("hero-"));

  return (
    <>
      <AdminHead title="Slider and images" lead="The home page slides and every named picture on the site. Upload high-resolution JPG or WebP photos at the size shown." />
      <Flash sp={await searchParams} />

      <form action={saveSlides} className="grid gap-4">
        <h2 className="heading text-xl">Home page slider</h2>
        {slides.map((sl, k) => (
          <Panel key={k} title={sl.title ? `Slide ${k + 1}` : "Add a slide"}>
            <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(s, sl.image)} alt="" className="aspect-video w-full rounded-xl border border-line object-cover" />
                <label className="field mt-3">
                  <span className="text-sm">Picture</span>
                  <select name={`slide_${k}_image`} defaultValue={sl.image} className="input">
                    {!heroSlots.some((h) => h.key === sl.image) ? <option value={sl.image}>Uploaded picture</option> : null}
                    {heroSlots.map((h) => (
                      <option key={h.key} value={h.key}>
                        {h.label} ({h.file})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field mt-2">
                  <span className="text-sm">Or upload a new one</span>
                  <input type="file" name={`slide_${k}_file`} accept="image/jpeg,image/png,image/webp,image/avif" className="input py-2 text-sm" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="field sm:col-span-2">
                  <span>Headline</span>
                  <input name={`slide_${k}_title`} defaultValue={sl.title} className="input" maxLength={120} placeholder="Leave empty to skip this slide" />
                </label>
                <label className="field sm:col-span-2">
                  <span>Text</span>
                  <textarea name={`slide_${k}_text`} defaultValue={sl.text} className="input !min-h-20" maxLength={260} />
                </label>
                <label className="field">
                  <span>Button label</span>
                  <input name={`slide_${k}_ctaLabel`} defaultValue={sl.ctaLabel} className="input" maxLength={40} />
                </label>
                <label className="field">
                  <span>Button goes to</span>
                  <input name={`slide_${k}_ctaHref`} defaultValue={sl.ctaHref} className="input" placeholder="/products/construction-equipment" />
                </label>
                {sl.title ? (
                  <div className="sm:col-span-2">
                    <Check label="Remove this slide" name={`slide_${k}_remove`} />
                  </div>
                ) : null}
              </div>
            </div>
          </Panel>
        ))}
        <div>
          <SubmitButton>Save slider</SubmitButton>
        </div>
      </form>

      <section id="images" className="mt-12 scroll-mt-20">
        <h2 className="heading text-xl">Pictures on the site</h2>
        <p className="mt-1 max-w-[70ch] text-ink-soft">
          Each picture has a name. Upload a replacement here, or your developer can drop a file with the same name into the site&apos;s images folder.
        </p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {IMAGE_SLOTS.map((slot) => {
            const replaced = !!s.images[slot.key];
            return (
              <li key={slot.key} className="overflow-hidden rounded-2xl border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl(s, slot.key)} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                <div className="p-4">
                  <p className="font-semibold">{slot.label}</p>
                  <p className="text-sm text-ink-soft">
                    {slot.file} · {slot.size}
                  </p>
                  <p className="text-sm text-ink-soft">{slot.usedOn}</p>
                  <form action={replaceSlotImage.bind(null, slot.key)} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" className="w-full text-sm" required />
                    <SubmitButton variant="outline" pendingText="Uploading…" className="!min-h-9 text-sm">
                      Replace
                    </SubmitButton>
                  </form>
                  {replaced ? (
                    <form action={resetSlotImage.bind(null, slot.key)} className="mt-2">
                      <button className="text-sm font-semibold text-ink-soft underline">Use the default picture again</button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
