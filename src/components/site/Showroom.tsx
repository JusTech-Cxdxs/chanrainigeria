"use client";

// The showroom pieces: a model's picture stage (studio angles and working photos, drag or swipe to move
// round, tap to view full screen), a captioned photo grid for machine types, and a film that loads only
// once the visitor presses play.
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { fill } from "./fill";

export type Shot = { src: string; studio?: boolean; caption?: string };
export type ShowroomLabels = { turn: string; full: string; close: string; prev: string; next: string; count: string; play: string };

function Lightbox({ shots, at, onAt, alt, L }: { shots: Shot[]; at: number | null; onAt: (i: number | null) => void; alt: string; L: ShowroomLabels }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const touch = useRef<number | null>(null);
  const n = shots.length;
  const go = useCallback((d: number) => onAt(at === null ? null : (at + d + n) % n), [at, n, onAt]);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (at !== null && !el.open) el.showModal();
    if (at === null && el.open) el.close();
  }, [at]);
  useEffect(() => {
    if (at === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [at, go]);

  const s = at === null ? null : shots[at];
  return (
    <dialog
      ref={dlg}
      onClose={() => onAt(null)}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-[#06120a]/95 p-0 text-white backdrop:bg-black/80"
      aria-label={alt}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      {s ? (
        <div className="flex h-full flex-col items-center justify-center p-4 sm:p-10" onClick={(e) => e.target === e.currentTarget && onAt(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={s.src}
            src={s.src}
            alt={s.caption ?? alt}
            className={`rise max-h-[80dvh] max-w-full rounded-xl object-contain ${s.studio ? "bg-white p-4 sm:p-8" : ""}`}
          />
          <p className="mt-4 max-w-[70ch] text-center text-sm text-white/75" aria-live="polite">
            {s.caption ? `${s.caption} · ` : ""}
            {fill(L.count, { n: at! + 1, total: n })}
          </p>
          <button type="button" onClick={() => onAt(null)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={L.close}>
            <Icon name="x" size={20} />
          </button>
          {n > 1 ? (
            <>
              <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={L.prev}>
                <Icon name="chevron-left" size={22} />
              </button>
              <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={L.next}>
                <Icon name="chevron-right" size={22} />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

/** A model's pictures: one large stage, thumbnails under it. Drag, swipe or use the arrow keys to move on. */
export function ModelStage({ shots, alt, labels: L }: { shots: Shot[]; alt: string; labels: ShowroomLabels }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState<number | null>(null);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const n = shots.length;
  const angles = shots.filter((s) => s.studio).length;
  const step = useCallback((d: number) => setI((c) => (c + d + n) % n), [n]);

  // Load the neighbours ahead so a turn is instant.
  useEffect(() => {
    for (const d of [1, -1]) {
      const img = new Image();
      img.src = shots[(i + d + n) % n].src;
    }
    strip.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [i, n, shots]);

  const s = shots[i];
  return (
    <div className="grid gap-3">
      <div
        className={`group relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-2xl ring-1 ring-line ${s.studio ? "bg-white" : "bg-deep"} ${n > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        tabIndex={0}
        role="group"
        aria-roledescription="picture viewer"
        aria-label={alt}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          else if (e.key === "ArrowLeft") step(-1);
          else if (e.key === "Enter") setFull(i);
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          const g = drag.current;
          if (!g || n < 2) return;
          const dx = e.clientX - g.x;
          if (Math.abs(dx) > 56) {
            step(dx < 0 ? 1 : -1);
            drag.current = { x: e.clientX, moved: true };
          }
        }}
        onPointerUp={() => {
          const g = drag.current;
          drag.current = null;
          if (g && !g.moved) setFull(i);
        }}
        onPointerLeave={() => (drag.current = null)}
      >
        {shots.map((x, k) =>
          Math.abs(k - i) <= 1 || Math.abs(k - i) === n - 1 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={x.src}
              src={x.src}
              alt={k === i ? alt : ""}
              aria-hidden={k !== i}
              draggable={false}
              loading={k === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${x.studio ? "object-contain p-[5%]" : "object-cover"} ${k === i ? "opacity-100" : "opacity-0"}`}
            />
          ) : null,
        )}
        {angles > 2 && s.studio ? (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#06120a]/75 px-3 py-1 text-xs font-semibold text-white">
            <Icon name="refresh" size={13} />
            {L.turn}
          </span>
        ) : null}
        <span className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#06120a]/70 text-white opacity-80 transition-opacity group-hover:opacity-100" aria-hidden>
          <Icon name="expand" size={16} />
        </span>
        {n > 1 ? (
          <>
            <button
              type="button"
              aria-label={L.prev}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => step(-1)}
              className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#06120a]/70 text-white hover:bg-[#06120a]"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <button
              type="button"
              aria-label={L.next}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => step(1)}
              className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#06120a]/70 text-white hover:bg-[#06120a]"
            >
              <Icon name="chevron-right" size={20} />
            </button>
            <span className="num pointer-events-none absolute bottom-3 right-3 rounded-full bg-[#06120a]/75 px-2.5 py-0.5 text-xs font-semibold text-white">{fill(L.count, { n: i + 1, total: n })}</span>
          </>
        ) : null}
      </div>
      {n > 1 ? (
        <div ref={strip} className="flex gap-2 overflow-x-auto pb-1">
          {shots.map((x, k) => (
            <button
              key={x.src}
              type="button"
              data-i={k}
              onClick={() => setI(k)}
              aria-label={fill(L.count, { n: k + 1, total: n })}
              aria-current={k === i}
              className={`relative h-16 w-[5.25rem] shrink-0 overflow-hidden rounded-lg ring-2 transition ${x.studio ? "bg-white" : "bg-deep"} ${k === i ? "ring-brand" : "ring-transparent opacity-75 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.src} alt="" loading="lazy" decoding="async" className={`h-full w-full ${x.studio ? "object-contain p-1" : "object-cover"}`} />
            </button>
          ))}
        </div>
      ) : null}
      <Lightbox shots={shots} at={full} onAt={setFull} alt={alt} L={L} />
    </div>
  );
}

/** Captioned photos in a grid; tap one to view it full screen. */
export function PhotoGrid({ shots, alt, labels: L }: { shots: Shot[]; alt: string; labels: ShowroomLabels }) {
  const [full, setFull] = useState<number | null>(null);
  return (
    <>
      <ul className={`grid gap-4 ${shots.length > 1 ? "sm:grid-cols-2" : "max-w-xl"} ${shots.length > 2 ? "lg:grid-cols-4" : ""}`}>
        {shots.map((s, k) => (
          <li key={s.src}>
            <button type="button" onClick={() => setFull(k)} className="group block w-full text-left" aria-label={`${s.caption ?? alt}. ${L.full}`}>
              <span className={`relative block aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-line ${s.studio ? "bg-white" : "bg-deep"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105 ${s.studio ? "object-contain p-[7%]" : "object-cover"}`}
                />
              </span>
              {s.caption ? <span className="mt-2 block text-sm text-ink-soft">{s.caption}</span> : null}
            </button>
          </li>
        ))}
      </ul>
      <Lightbox shots={shots} at={full} onAt={setFull} alt={alt} L={L} />
    </>
  );
}

/** A film behind its poster. Nothing is loaded from the player until the visitor presses play. */
export function FilmCard({ film, playLabel }: { film: { youtube?: string; mp4?: string; poster?: string; title: string; by: string }; playLabel: string }) {
  const [on, setOn] = useState(false);
  return (
    <figure>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-deep ring-1 ring-line">
        {on && film.youtube ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${film.youtube}?autoplay=1&rel=0`}
            title={film.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : on && film.mp4 ? (
          <video src={film.mp4} poster={film.poster} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black" />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 h-full w-full" aria-label={`${playLabel}: ${film.title}`}>
            {film.poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={film.poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-t from-[#06120a]/70 via-[#06120a]/15 to-transparent" aria-hidden />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-on-brand shadow-xl transition-transform group-hover:scale-110">
              <Icon name="play" size={26} />
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3">
        <span className="heading block text-lg">{film.title}</span>
        <span className="text-sm text-ink-soft">{film.by}</span>
      </figcaption>
    </figure>
  );
}
