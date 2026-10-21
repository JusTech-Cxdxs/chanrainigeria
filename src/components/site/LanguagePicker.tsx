"use client";
// Whole-page translation through Google Translate. Nothing is loaded from Google until a visitor
// picks a language, so English visitors make no third-party requests.
import { useEffect, useRef, useState } from "react";

const NAMES: Record<string, string> = {
  en: "English",
  fr: "Français",
  "zh-CN": "中文",
  hi: "हिन्दी",
  ar: "العربية",
  pt: "Português",
  ha: "Hausa",
  yo: "Yorùbá",
  ig: "Igbo",
  es: "Español",
  de: "Deutsch",
};

declare global {
  interface Window {
    __cnGT?: () => void;
    google?: { translate?: { TranslateElement: new (o: object, id: string) => unknown } };
  }
}

function currentLang() {
  const m = document.cookie.match(/(?:^|; )googtrans=\/en\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "en";
}

function setLang(code: string) {
  const host = location.hostname;
  const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  // Google reads the cookie on the bare host and on the parent domain; clear both, then set.
  for (const d of ["", `; domain=${host}`, `; domain=.${host.split(".").slice(-2).join(".")}`]) {
    document.cookie = `googtrans=; ${expire}; path=/${d}`;
  }
  if (code !== "en") document.cookie = `googtrans=/en/${code}; path=/; SameSite=Lax`;
  location.reload();
}

export function LanguagePicker({ languages }: { languages: string[] }) {
  const [open, setOpen] = useState(false);
  const [lang, setLangState] = useState("en");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l = currentLang();
    setLangState(l);
    if (l === "en" || document.getElementById("gt-script")) return;
    window.__cnGT = () => {
      if (window.google?.translate) new window.google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "gt-el");
    };
    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "https://translate.google.com/translate_a/element.js?cb=__cnGT";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const list = ["en", ...languages.filter((l) => l !== "en" && NAMES[l])];
  return (
    <div ref={box} className="relative notranslate" translate="no">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors hover:bg-current/10"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${NAMES[lang] ?? lang}`}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <span className="hidden uppercase sm:inline">{lang === "zh-CN" ? "中文" : lang}</span>
      </button>
      {open ? (
        <ul role="listbox" aria-label="Choose a language" className="pop absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 text-ink shadow-2xl">
          {list.map((code) => (
            <li key={code}>
              <button
                type="button"
                role="option"
                aria-selected={code === lang}
                onClick={() => setLang(code)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[0.95rem] hover:bg-concrete ${code === lang ? "font-semibold text-brand" : ""}`}
              >
                {NAMES[code]}
                {code === lang ? <span aria-hidden>✓</span> : null}
              </button>
            </li>
          ))}
          <li className="border-t border-line-soft px-4 pb-1 pt-2 text-xs text-ink-soft">Translated by Google. Some terms may be imperfect.</li>
        </ul>
      ) : null}
      <div id="gt-el" className="hidden" />
    </div>
  );
}
