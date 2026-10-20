"use client";
// First-party visit counter. Sends nothing until the visitor accepts optional cookies.
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent } from "./CookieBanner";

export function Analytics() {
  const path = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent() === "granted");
    const on = (e: Event) => setAllowed((e as CustomEvent).detail === "granted");
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);

  useEffect(() => {
    if (!allowed || !path) return;
    const params = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      path,
      referrer: document.referrer || null,
      source: params.get("utm_source") || params.get("ref") || null,
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  }, [allowed, path]);

  return null;
}
