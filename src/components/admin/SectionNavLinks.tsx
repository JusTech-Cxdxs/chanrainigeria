"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * The in-page section list. A row of chips that scrolls sideways on phones and tablets; a sticky
 * column on wide screens. The section in view is highlighted.
 */
export function SectionNavLinks({ links }: { links: { id: string; label: string; icon: string }[] }) {
  const [active, setActive] = useState(links[0]?.id);
  useEffect(() => {
    const els = links.map((l) => document.getElementById(l.id)).filter((x): x is HTMLElement => !!x);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const seen = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        const best = links.find((l) => (seen.get(l.id) ?? 0) > 0);
        if (best) setActive(best.id);
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: [0, 0.01, 0.2] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [links]);

  return (
    <nav aria-label="Sections on this page" className="sticky top-0 z-20 -mx-4 bg-concrete/95 px-4 py-2 backdrop-blur sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <ul className="scroll-thin flex gap-1.5 overflow-x-auto pb-1 lg:sticky lg:top-6 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {links.map((l) => {
          const on = l.id === active;
          return (
            <li key={l.id} className="shrink-0">
              <a
                href={`#${l.id}`}
                onClick={() => setActive(l.id)}
                aria-current={on ? "true" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-full lg:whitespace-normal lg:leading-snug border px-3 py-1.5 text-sm font-semibold transition-colors lg:rounded-xl lg:border-transparent lg:px-3 lg:py-2 ${
                  on ? "border-brand bg-brand/10 text-brand" : "border-line bg-surface text-ink-soft hover:text-ink lg:bg-transparent lg:hover:bg-surface"
                }`}
              >
                <Icon name={l.icon} size={16} />
                {l.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
