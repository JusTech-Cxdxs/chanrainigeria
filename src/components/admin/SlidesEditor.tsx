"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { SaveBar } from "./cms";
import { MediaPicker } from "./MediaPicker";
import { linkProblem } from "./PageEditor";

type Slide = { title: string; text: string; image: string; ctaLabel: string; ctaHref: string };
const MAX = 6;

function Save({ dirty, invalid }: { dirty: boolean; invalid: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" disabled={pending || !dirty || invalid}>
      <Icon name="save" size={17} /> {pending ? "Saving…" : "Save slider"}
    </button>
  );
}

/** The home page slider: up to six slides, each with a picture, headline, text and button. */
export function SlidesEditor({ initial, slotUrls, action }: { initial: Slide[]; slotUrls: Record<string, string>; action: (f: FormData) => void | Promise<void> }) {
  const [slides, setSlides] = useState(initial);
  const dirty = JSON.stringify(slides) !== JSON.stringify(initial);
  const set = (i: number, k: keyof Slide, v: string) => setSlides((cur) => cur.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const move = (i: number, d: number) =>
    setSlides((cur) => {
      const next = [...cur];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });
  const invalid = slides.some((s) => !s.title.trim() || !!linkProblem(s.ctaHref));

  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <input type="hidden" name="slides" value={JSON.stringify(slides)} />
      <ol className="grid grid-cols-[minmax(0,1fr)] gap-4">
        {slides.map((s, i) => {
          const hrefProblem = linkProblem(s.ctaHref);
          return (
            <li key={i} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-1">
                <span className="grid h-8 min-w-8 place-items-center rounded-full bg-brand/10 px-2 text-sm font-bold text-brand num">{i + 1}</span>
                <span className="ml-2 flex-1 truncate font-semibold">{s.title || `Slide ${i + 1}`}</span>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move slide ${i + 1} earlier`}>
                  <Icon name="arrow-up" size={17} />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-concrete disabled:opacity-30"
                  disabled={i === slides.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move slide ${i + 1} later`}
                >
                  <Icon name="arrow-down" size={17} />
                </button>
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-lg text-danger hover:bg-concrete disabled:opacity-30"
                  disabled={slides.length <= 1}
                  onClick={() => setSlides((cur) => cur.filter((_, j) => j !== i))}
                  aria-label={`Remove slide ${i + 1}`}
                  title={slides.length <= 1 ? "Keep at least one slide" : "Remove"}
                >
                  <Icon name="trash" size={17} />
                </button>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                <div className="grid content-start gap-1.5">
                  <span className="font-semibold">Picture</span>
                  <small className="text-[0.8125rem] text-ink-soft">A wide landscape photo, at least 2400 × 1350 pixels. Text sits on the left, so keep the subject to the right.</small>
                  <MediaPicker value={s.image} onChange={(v) => set(i, "image", v)} folder="Home slider" originalUrl={slotUrls[`hero-${(i % 3) + 1}`]} originalLabel="Use the standard photo" resolve={slotUrls} stacked />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)] content-start items-start gap-4 sm:grid-cols-2">
                  <label className="field sm:col-span-2">
                    <span>Headline</span>
                    <input value={s.title} onChange={(e) => set(i, "title", e.target.value)} className="input" maxLength={120} required />
                    <small>
                      <span className="num">{s.title.length} / 60</span> characters suggested. Short headlines read best on phones.
                    </small>
                  </label>
                  <label className="field sm:col-span-2">
                    <span>Text under the headline</span>
                    <textarea value={s.text} onChange={(e) => set(i, "text", e.target.value)} className="input !min-h-20" maxLength={260} />
                    <small>
                      <span className="num">{s.text.length} / 160</span> characters suggested.
                    </small>
                  </label>
                  <label className="field">
                    <span>Button text</span>
                    <input value={s.ctaLabel} onChange={(e) => set(i, "ctaLabel", e.target.value)} className="input" maxLength={40} placeholder="Learn more" />
                  </label>
                  <label className="field">
                    <span>Button goes to</span>
                    <input
                      value={s.ctaHref}
                      onChange={(e) => set(i, "ctaHref", e.target.value)}
                      className="input"
                      placeholder="/products/cng-gas-equipment"
                      aria-invalid={!!hrefProblem}
                      style={hrefProblem ? { borderColor: "var(--danger)" } : undefined}
                    />
                    <small className={hrefProblem ? "!text-danger font-semibold" : ""}>{hrefProblem ?? "A page on this site, like /products, or a full address starting with https://"}</small>
                  </label>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        className="btn btn-outline justify-self-start"
        disabled={slides.length >= MAX}
        onClick={() => setSlides((cur) => [...cur, { title: "", text: "", image: `hero-${(cur.length % 3) + 1}`, ctaLabel: "Learn more", ctaHref: "/products" }])}
      >
        <Icon name="plus" size={17} /> Add a slide {slides.length >= MAX ? `(up to ${MAX})` : ""}
      </button>
      <SaveBar note={dirty ? <span className="font-semibold text-ink">Unsaved changes to the slider</span> : `${slides.length} slide${slides.length === 1 ? "" : "s"}, all saved.`}>
        {dirty ? (
          <button type="button" className="btn btn-outline" onClick={() => setSlides(initial)}>
            Discard
          </button>
        ) : null}
        <Save dirty={dirty} invalid={invalid} />
      </SaveBar>
    </form>
  );
}
