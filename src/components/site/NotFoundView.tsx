import Link from "next/link";
import { Leaf } from "@/components/brand/Leaf";
import { Machine } from "@/components/Machine";
import { Icon } from "@/components/ui/Icon";
import { siteContent } from "./site-content";

/** "Page not found", in the site's dark green banner style. Wording: Pages and text → Page not found. */
export async function NotFoundView() {
  const c = await siteContent("not-found");
  const quick = c.list("quickLinks").filter((q) => q.label && q.href);
  return (
    <section className="mesh relative isolate overflow-hidden text-white">
      <Leaf className="pointer-events-none absolute -right-16 -top-10 -z-10 h-[28rem] w-auto opacity-10" color="#ffffff" />
      <div className="wrap grid min-h-[78svh] items-center gap-12 pb-16 pt-[calc(var(--header-h)+3rem)] lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="rise flex items-center gap-3 text-sm font-semibold text-mint">
            <span className="h-px w-10 bg-mint" aria-hidden />
            {c.t("eyebrow")}
          </p>
          <h1 className="display rise mt-4 max-w-[18ch] text-[2.4rem] sm:text-5xl lg:text-6xl" style={{ animationDelay: "60ms" }}>
            {c.t("title")}
          </h1>
          <p className="rise mt-5 max-w-[52ch] text-lg text-white/80" style={{ animationDelay: "120ms" }}>
            {c.t("text")}
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "180ms" }}>
            <Link href={c.t("primaryLink") || "/products"} className="btn btn-primary">
              <Icon name="package" />
              {c.t("primary")}
            </Link>
            <Link href={c.t("secondaryLink") || "/contact"} className="btn btn-glass">
              <Icon name="mail" />
              {c.t("secondary")}
            </Link>
          </div>
          {quick.length ? (
            <div className="rise mt-10" style={{ animationDelay: "240ms" }}>
              <p className="text-sm font-semibold text-white/60">{c.t("helpTitle")}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {quick.map((q, i) => (
                  <li key={`${q.href}-${i}`}>
                    <Link
                      href={q.href}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur transition-colors hover:border-mint hover:text-mint"
                    >
                      {q.label}
                      <Icon name="arrow" size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="relative hidden lg:block" aria-hidden>
          <span className="display pointer-events-none absolute inset-x-0 -top-10 select-none text-center text-[11rem] leading-none text-white/[0.06]">404</span>
          <div className="relative rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur [--drawing:var(--mint)]">
            <Machine kind="excavator" className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
