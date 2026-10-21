"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fades sections in as they scroll into view. Anything with class "reveal" takes part.
 * A scroll check backs up the observer, so fast flicks or anchor jumps never leave a section hidden.
 */
export function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const pending = () => Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"));
    const show = (e: Element) => e.classList.add("is-in");
    if (!("IntersectionObserver" in window)) {
      pending().forEach(show);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    pending().forEach((e) => io.observe(e));

    let ticking = false;
    const sweep = () => {
      ticking = false;
      const limit = window.innerHeight * 1.05;
      for (const e of pending()) if (e.getBoundingClientRect().top < limit) show(e);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(sweep);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const late = setTimeout(sweep, 400);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(late);
    };
  }, [path]);
  return null;
}
