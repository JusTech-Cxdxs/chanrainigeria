"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SEARCH_OPEN } from "./search-events";

type Hit = { title: string; text?: string; href: string };
type Group = { label: string; hits: Hit[] };

const SUGGESTIONS = ["Excavator", "Forklift", "CNG dispenser", "Book a technician", "Parts", "Phone number"];

/**
 * One search box for the whole site (Ctrl K or ⌘K anywhere). Results come back grouped:
 * contact details, models, machine types, product lines, services, news, locations and pages.
 */
export function SearchDialog({ endpoint = "/api/search", placeholder = "Search machines, services, parts, contacts…" }: { endpoint?: string; placeholder?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [busy, setBusy] = useState(false);
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  useEffect(() => {
    const show = () => setOpen(true);
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !/input|textarea|select/i.test((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(SEARCH_OPEN, show);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener(SEARCH_OPEN, show);
      window.removeEventListener("keydown", key);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30);
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setGroups([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const j = await r.json();
        setGroups(j.groups ?? []);
        setCursor(0);
      } catch {}
      setBusy(false);
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, endpoint]);

  function go(h: Hit) {
    setOpen(false);
    setQ("");
    if (/^(tel|mailto):/.test(h.href)) window.location.href = h.href;
    else router.push(h.href);
  }

  if (!open) return null;
  let idx = -1;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-3 pt-[min(12vh,6rem)] sm:p-6 sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search">
      <button className="fade absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label="Close search" onClick={() => setOpen(false)} />
      <div className="pop relative flex max-h-[80dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="shrink-0 text-ink-soft" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, flat.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && flat[cursor]) go(flat[cursor]);
            }}
            placeholder={placeholder}
            className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-soft/80"
            aria-label="Search"
            maxLength={80}
          />
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden /> : null}
          <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-line px-2 py-0.5 text-xs text-ink-soft">
            Esc
          </button>
        </div>

        <div className="scroll-thin overflow-y-auto p-2" aria-live="polite">
          {q.trim().length < 2 ? (
            <div className="p-3">
              <p className="text-sm text-ink-soft">Try</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-brand hover:text-brand">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : groups.length === 0 && !busy ? (
            <p className="p-5 text-ink-soft">Nothing matches &ldquo;{q}&rdquo;. Try a machine type, a model number or a service.</p>
          ) : (
            groups.map((g) => (
              <section key={g.label} className="mb-2">
                <h3 className="px-3 pb-1 pt-2 text-xs font-semibold text-ink-soft">{g.label}</h3>
                <ul>
                  {g.hits.map((h) => {
                    idx += 1;
                    const i = idx;
                    return (
                      <li key={`${g.label}-${h.href}-${h.title}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setCursor(i)}
                          onClick={() => go(h)}
                          className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left ${cursor === i ? "bg-brand/10" : "hover:bg-concrete"}`}
                        >
                          <span className="font-semibold">{h.title}</span>
                          {h.text ? <span className="line-clamp-1 text-sm text-ink-soft">{h.text}</span> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
        <p className="hidden border-t border-line px-4 py-2 text-xs text-ink-soft sm:block">↑ ↓ to move, Enter to open, Esc to close</p>
      </div>
    </div>
  );
}
