"use client";
import Link from "next/link";
import { srcSetFor } from "@/lib/responsive-image";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeroSlide = { title: string; text: string; image: string; ctaLabel: string; ctaHref: string };

const INTERVAL = 6500;

/** Full-bleed home slider: background photo with a slow zoom, headline, two actions, swipe and keyboard support. */
export function HeroSlider({ slides, eyebrow, secondary }: { slides: HeroSlide[]; eyebrow: string; secondary: { label: string; href: string } }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const n = slides.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setTimeout(() => go(i + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, n, go]);

  useEffect(() => {
    const hidden = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);

  if (!n) return null;
  return (
    <section
      className="relative isolate flex min-h-[max(560px,min(92svh,880px))] items-end overflow-hidden bg-deep text-white"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
    >
      {slides.map((s, k) => (
        <div
          key={k}
          className={`absolute inset-x-0 top-0 -z-20 h-[64%] overflow-hidden transition-opacity duration-1000 sm:inset-0 sm:h-auto ${k === i ? "opacity-100" : "opacity-0"}`}
          aria-hidden={k !== i}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            srcSet={srcSetFor(s.image)}
            sizes="100vw"
            alt=""
            decoding="async"
            className="h-full w-full object-cover object-center"
            style={k === i ? { animation: `kenburns ${INTERVAL + 1500}ms ease-out both` } : undefined}
            fetchPriority={k === 0 ? "high" : "low"}
            loading={k === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
      {/* Phones: a light shade for the header, then the photo fades into the green behind the text. */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[64%] bg-gradient-to-b from-[#06120a]/60 via-[#06120a]/30 via-30% to-[#0b2416] sm:hidden" aria-hidden />
      {/* Tablets and desktop: text side shaded, the equipment side left bright. */}
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-[#06120a]/85 via-[#06120a]/45 to-transparent sm:block" aria-hidden />
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-t from-[#06120a]/75 via-transparent via-45% to-[#06120a]/35 sm:block" aria-hidden />

      <div className="wrap pb-16 pt-[calc(var(--header-h)+3rem)] sm:pb-24">
        <div key={i} className="max-w-3xl max-sm:[text-shadow:0_2px_14px_rgb(6_18_10/0.65)]" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}>
          <p className="rise flex items-center gap-3 text-sm font-semibold text-mint">
            <span className="h-px w-10 bg-mint" aria-hidden />
            {eyebrow}
          </p>
          <h1 className="display rise mt-4 text-[2.6rem] sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
            {slides[i].title}
          </h1>
          <p className="rise mt-5 max-w-[52ch] text-lg text-white/85 sm:text-xl" style={{ animationDelay: "160ms" }}>
            {slides[i].text}
          </p>
          {/* Phones: both buttons full width, one under the other. Wider screens: side by side. */}
          <div className="rise mt-8 grid gap-3 min-[480px]:flex min-[480px]:flex-wrap" style={{ animationDelay: "240ms" }}>
            <Link href={slides[i].ctaHref} className="btn btn-primary w-full min-[480px]:w-auto">
              {slides[i].ctaLabel}
            </Link>
            <Link href={secondary.href} className="btn btn-glass w-full min-[480px]:w-auto">
              {secondary.label}
            </Link>
          </div>
        </div>

        {n > 1 ? (
          <div className="mt-12 flex items-center gap-4">
            <div className="flex gap-2" role="tablist" aria-label="Choose a slide">
              {slides.map((s, k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={k === i}
                  aria-label={`Slide ${k + 1}: ${s.title}`}
                  onClick={() => go(k)}
                  className="relative h-1.5 w-12 overflow-hidden rounded-full bg-white/25 sm:w-16"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-mint"
                    style={
                      k === i
                        ? paused
                          ? { width: "100%" }
                          : { width: "100%", transformOrigin: "left", animation: `grow ${INTERVAL}ms linear both` }
                        : { width: k < i ? "100%" : "0%", opacity: k < i ? 0.5 : 1 }
                    }
                  />
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              {[
                ["Previous slide", -1, "M15 6l-6 6 6 6"],
                ["Next slide", 1, "M9 6l6 6-6 6"],
              ].map(([label, d, path]) => (
                <button
                  key={label as string}
                  type="button"
                  aria-label={label as string}
                  onClick={() => go(i + (d as number))}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur hover:bg-white/20"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <path d={path as string} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
