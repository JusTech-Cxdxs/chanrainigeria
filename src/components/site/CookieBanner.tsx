"use client";
// Consent banner built to the NDPA / GAID 2025 pattern:
// Accept and Reject are equally prominent on the first screen, nothing optional loads before a choice,
// and the choice is recorded server-side. "Cookie settings" anywhere on the site reopens the choice.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { Labels } from "./fill";

const COOKIE = "cn_consent";
export const CONSENT_EVENT = "cn-consent-change";
const OPEN_EVENT = "cn-open-cookie-settings";

export function readConsent(): "granted" | "denied" | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )cn_consent=([^;]+)/);
  return m ? (m[1] as "granted" | "denied") : null;
}

function save(analytics: boolean) {
  const v = analytics ? "granted" : "denied";
  document.cookie = `${COOKIE}=${v}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`;
  fetch("/api/consent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ analytics }),
    keepalive: true,
  }).catch(() => {});
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function CookieBanner({ labels: L }: { labels: Labels }) {
  const [view, setView] = useState<"none" | "banner" | "prefs">("none");
  const [current, setCurrent] = useState<"granted" | "denied" | null>(null);
  const [stats, setStats] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const c = readConsent();
    setCurrent(c);
    setView(c === null ? "banner" : "none");
    const reopen = () => {
      opener.current = document.activeElement as HTMLElement | null;
      const now = readConsent();
      setCurrent(now);
      setStats(now === "granted");
      setView("prefs");
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  // The settings window behaves like a dialog: focus moves in, Escape closes, focus goes back.
  useEffect(() => {
    if (view !== "prefs") return;
    const t = setTimeout(() => dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 30);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && dialog.current) {
        const items = [...dialog.current.querySelectorAll<HTMLElement>("button, a, input")].filter((x) => !x.hasAttribute("disabled"));
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", key);
    };
  }, [view]);

  function close() {
    setView(readConsent() === null ? "banner" : "none");
    opener.current?.focus?.();
  }
  function choose(analytics: boolean) {
    save(analytics);
    setCurrent(analytics ? "granted" : "denied");
    setView("none");
    opener.current?.focus?.();
  }

  if (view === "banner") {
    return (
      <div role="region" aria-label={L.prefsTitle} className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-brand bg-surface shadow-[0_-8px_30px_rgb(0_0_0/0.12)]">
        <div className="wrap flex flex-col gap-4 py-4 md:flex-row md:items-center">
          <p className="flex gap-3 text-[0.95rem] measure">
            <Icon name="shield" size={20} className="mt-0.5 hidden shrink-0 text-brand-ink sm:block" />
            <span>
              {L.text}{" "}
              <Link href="/cookies" className="font-semibold text-brand-ink underline underline-offset-2">
                {L.noticeLink}
              </Link>
            </span>
          </p>
          <div className="flex shrink-0 flex-wrap gap-3 md:ml-auto md:flex-nowrap">
            <button
              type="button"
              className="btn btn-quiet order-last w-full sm:order-none sm:w-auto"
              onClick={() => {
                opener.current = document.activeElement as HTMLElement | null;
                setStats(false);
                setView("prefs");
              }}
            >
              <Icon name="gear" size={16} />
              {L.customise}
            </button>
            <button type="button" className="btn btn-outline flex-1 md:flex-none" onClick={() => choose(false)}>
              {L.reject}
            </button>
            <button type="button" className="btn btn-primary flex-1 md:flex-none" onClick={() => choose(true)}>
              {L.accept}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view !== "prefs") return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button type="button" className="fade absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label={L.close} tabIndex={-1} onClick={close} />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-title"
        className="pop relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-line bg-surface p-6 text-ink shadow-2xl sm:p-7"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand-ink">
            <Icon name="shield" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="cookie-prefs-title" className="heading text-xl" tabIndex={-1} data-autofocus>
              {L.prefsTitle}
            </h2>
            <p className="mt-1 text-[0.95rem] text-ink-soft">{L.prefsIntro}</p>
          </div>
          <button type="button" onClick={close} className="-mr-2 -mt-2 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-concrete" aria-label={L.close}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <p className="mt-5 flex items-center gap-2 rounded-xl bg-concrete px-4 py-2.5 text-sm font-semibold" role="status">
          <span className={`h-2 w-2 shrink-0 rounded-full ${current === "granted" ? "bg-leaf" : current === "denied" ? "bg-ink-soft" : "bg-line"}`} aria-hidden />
          {current === "granted" ? L.currentGranted : current === "denied" ? L.currentDenied : L.currentNone}
        </p>

        <ul className="mt-4 divide-y divide-line-soft rounded-2xl border border-line">
          <li className="flex items-start gap-4 p-4">
            <div className="flex-1">
              <p className="font-semibold">{L.essentialTitle}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{L.essentialText}</p>
            </div>
            <span className="mt-0.5 shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-ink">{L.alwaysOn}</span>
          </li>
          <li>
            <label className="flex cursor-pointer items-start gap-4 p-4">
              <span className="flex-1">
                <span className="block font-semibold">{L.statsTitle}</span>
                <span className="mt-0.5 block text-sm text-ink-soft">{L.statsText}</span>
              </span>
              <input type="checkbox" role="switch" className="peer sr-only" checked={stats} onChange={(e) => setStats(e.target.checked)} aria-checked={stats} />
              <span
                aria-hidden
                className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>
          </li>
        </ul>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button type="button" className="btn btn-outline" onClick={() => choose(false)}>
            {L.reject}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => choose(stats)}>
            <Icon name="save" size={16} />
            {L.save}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => choose(true)}>
            {L.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Cookie settings": reopens the cookie choice from the footer or the cookie notice. */
export function CookieSettingsLink({ label, className = "hover:text-white" }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={openCookieSettings} aria-haspopup="dialog">
      {label}
    </button>
  );
}
