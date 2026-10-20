"use client";
// Logo reveal on the first page of a visit. Skipped on later navigations, and short with reduced motion.
import { useEffect, useState } from "react";

export function BrandLoader({ logo, name }: { logo: string | null; name: string }) {
  const [state, setState] = useState<"show" | "done" | "skip">("show");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("cn_loaded") === "1";
      sessionStorage.setItem("cn_loaded", "1");
    } catch {}
    if (seen) return setState("skip");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setState("done"), reduce ? 150 : 1200);
    return () => clearTimeout(t);
  }, []);

  if (state === "skip") return null;
  return (
    <div className="loader-veil" data-done={state === "done"} aria-hidden>
      <div className="grid justify-items-center gap-5">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-16 w-auto" />
        ) : (
          <span className="display text-3xl">{name}</span>
        )}
        <div className="h-[3px] w-40 overflow-hidden rounded bg-line-soft">
          <div className="loader-bar" />
        </div>
      </div>
    </div>
  );
}
