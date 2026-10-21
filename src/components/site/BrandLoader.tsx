"use client";
// The leaf grows in petal by petal on the first page of a visit. Skipped on later pages.
import { useEffect, useState } from "react";
import { Leaf } from "@/components/brand/Leaf";

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
    const t = setTimeout(() => setState("done"), reduce ? 150 : 1300);
    return () => clearTimeout(t);
  }, []);

  if (state === "skip") return null;
  return (
    <div className="loader-veil" data-done={state === "done"} aria-hidden>
      <div className="grid justify-items-center gap-6">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-16 w-auto" />
        ) : (
          <Leaf animated className="h-24 w-auto" />
        )}
        <span className="display text-lg tracking-wide text-ink">{name}</span>
        <div className="h-[3px] w-40 overflow-hidden rounded bg-line-soft">
          <div className="loader-bar" />
        </div>
      </div>
    </div>
  );
}
