"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
const label: Record<Mode, string> = { system: "Theme: automatic", light: "Theme: light", dark: "Theme: dark" };

/** Cycles automatic → light → dark. The choice is kept on this device only. */
export function ThemeToggle({ withLabel = false, className = "" }: { withLabel?: boolean; className?: string }) {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "light" || t === "dark") setMode(t);
    } catch {}
  }, []);

  function cycle() {
    const m = next[mode];
    setMode(m);
    const root = document.documentElement;
    root.classList.add("theme-switching");
    if (m === "system") delete root.dataset.theme;
    else root.dataset.theme = m;
    setTimeout(() => root.classList.remove("theme-switching"), 260);
    try {
      if (m === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", m);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 transition-colors hover:bg-current/10 ${className}`}
      aria-label={label[mode]}
      title={label[mode]}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        {mode === "dark" ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        ) : mode === "light" ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
          </>
        )}
      </svg>
      {withLabel ? <span className="text-sm font-semibold">{label[mode]}</span> : null}
    </button>
  );
}
