import { saveSlides, saveSlotImages } from "@/app/admin/actions/appearance";
import { Section } from "@/components/admin/cms";
import { ItemHistory } from "@/components/admin/ItemHistory";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { SlidesEditor } from "@/components/admin/SlidesEditor";
import { AdminHead, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { IMAGE_SLOTS } from "@/lib/image-slots";
import { getSettings, imageUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

const FOLDER: Record<string, string> = { hero: "Home slider", page: "Page banners", category: "Products", og: "Page banners" };

export default async function Appearance({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireAdmin("pages");
  const s = await getSettings();
  const slotUrls = Object.fromEntries(IMAGE_SLOTS.map((x) => [x.key, imageUrl(s, x.key)]));
  const originals = Object.fromEntries(IMAGE_SLOTS.map((x) => [x.key, `/images/${x.file}`]));

  return (
    <>
      <AdminHead
        title="Home slider and site pictures"
        lead="The large photo slider at the top of the home page, and the named pictures used as page banners and link previews. Every save is kept in History, so a replaced photo can always be put back."
        actions={
          <a href="/" target="_blank" rel="noopener" className="btn btn-outline">
            <Icon name="external" size={17} /> View home page
          </a>
        }
      />
      <Flash sp={await searchParams} />

      <Section title="Home page slider" icon="images" hint="Slides rotate every few seconds. The first slide is the one most visitors see, so put the most important message there.">
        <SlidesEditor initial={s.home.slides} slotUrls={slotUrls} action={saveSlides} />
      </Section>

      <form action={saveSlotImages} id="images" className="mt-8 scroll-mt-6">
        <Section
          title="Pictures on the site"
          icon="image"
          hint="Each picture has a fixed place on the site. Choose a replacement from the library or upload one at the size shown. Use the original to go back to the picture the site shipped with."
        >
          <ul className="grid gap-4 md:grid-cols-2">
            {IMAGE_SLOTS.map((slot) => (
              <li key={slot.key} className="rounded-xl border border-line bg-concrete/40 p-3 sm:p-4">
                <p className="font-semibold">{slot.label}</p>
                <p className="mb-3 text-[0.8125rem] text-ink-soft">
                  {slot.usedOn} · best at <span className="num">{slot.size}</span> pixels
                </p>
                <MediaPicker
                  name={`img_${slot.key}`}
                  defaultValue={s.images[slot.key] ?? ""}
                  folder={FOLDER[slot.key.split("-")[0]] ?? "Page banners"}
                  originalUrl={originals[slot.key]}
                  removable={false}
                />
              </li>
            ))}
          </ul>
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mt-5 flex justify-end lg:bottom-4">
            <SubmitButton>
              <Icon name="save" size={17} /> Save pictures
            </SubmitButton>
          </div>
        </Section>
      </form>
      <ItemHistory entity="settings" id="1" viewer={me} title="Earlier versions of the slider and settings" />
    </>
  );
}
