"use client";
// Consent banner built to the NDPA / GAID 2025 pattern:
// Accept and Reject are equally prominent on the first screen, nothing optional loads before a choice,
// and the choice is recorded server-side.
import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE = "cn_consent";
export const CONSENT_EVENT = "cn-consent-change";

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

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener("cn-open-cookie-settings", reopen);
    return () => window.removeEventListener("cn-open-cookie-settings", reopen);
  }, []);

  if (!open) return null;
  return (
    <div
      role="region"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-brand bg-surface shadow-[0_-8px_30px_rgb(0_0_0/0.12)]"
    >
      <div className="wrap flex flex-col gap-4 py-4 md:flex-row md:items-center">
        <p className="text-[0.95rem] measure">
          We use essential cookies to run this site. With your permission we also count page visits to improve it. No
          advertising cookies. <Link href="/cookies" className="text-brand underline underline-offset-2">Cookie notice</Link>
        </p>
        <div className="flex shrink-0 gap-3 md:ml-auto">
          <button
            type="button"
            className="btn btn-outline flex-1 md:flex-none"
            onClick={() => {
              save(false);
              setOpen(false);
            }}
          >
            Reject optional
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1 md:flex-none"
            onClick={() => {
              save(true);
              setOpen(false);
            }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      className="hover:text-brand"
      onClick={() => window.dispatchEvent(new Event("cn-open-cookie-settings"))}
    >
      Cookie settings
    </button>
  );
}
