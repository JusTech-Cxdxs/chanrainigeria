"use client";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";

// Enyo's replies, shown like a modern chat: links become buttons-in-text with readable names (never raw
// paths), "- " lines become a list, **bold** is bold, and the newest reply appears word by word.

/** A readable name for a site path when the reply didn't give one: /products/cng-gas-equipment → "CNG gas equipment". */
function nameFor(path: string) {
  const last = path.split(/[?#]/)[0].split("/").filter(Boolean).at(-1) ?? "home";
  const words = last.replace(/-/g, " ");
  return words.replace(/\b(cng|byd|faq)\b/gi, (w) => w.toUpperCase()).replace(/^./, (c) => c.toUpperCase());
}

const SAFE_PATH = /^\/(?![/\\])[^\s\\)]*$/;

type Tok = { t: "text"; v: string } | { t: "link"; label: string; href: string } | { t: "mail"; v: string } | { t: "bold"; v: string };

/** Splits one line into text, links, emails and bold runs. */
function tokens(line: string): Tok[] {
  const out: Tok[] = [];
  // [label](/path) · Label (/path) · bare /path · email · **bold**
  const re =
    /\[([^\]]{1,80})\]\((\/[^\s)]*|https:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+)\)|([A-Z][\w&' ,-]{1,60}?)\s\((\/[a-z0-9\-/#?=&]*)\)|(^|\s)(\/[a-z0-9][a-z0-9\-/#?=&]*)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|\*\*([^*]{1,120})\*\*/gi;
  let last = 0;
  for (const m of line.matchAll(re)) {
    if (m.index! > last) out.push({ t: "text", v: line.slice(last, m.index) });
    if (m[1] && m[2]) {
      const href = m[2];
      if (SAFE_PATH.test(href) || /^(https:|mailto:|tel:)/i.test(href)) out.push({ t: "link", label: m[1], href });
      else out.push({ t: "text", v: m[1] });
    } else if (m[3] && m[4]) {
      out.push({ t: "link", label: m[3].trim(), href: m[4] });
    } else if (m[6]) {
      const href = m[6].replace(/[.,;:]$/, "");
      out.push({ t: "text", v: m[5] ?? "" });
      out.push({ t: "link", label: nameFor(href), href });
      if (href.length < m[6].length) out.push({ t: "text", v: m[6].slice(href.length) });
    } else if (m[7]) {
      out.push({ t: "mail", v: m[7] });
    } else if (m[8]) {
      out.push({ t: "bold", v: m[8] });
    }
    last = m.index! + m[0].length;
  }
  if (last < line.length) out.push({ t: "text", v: line.slice(last) });
  return out;
}

function Line({ text }: { text: string }) {
  return (
    <>
      {tokens(text).map((k, i) =>
        k.t === "link" ? (
          k.href.startsWith("/") ? (
            <Link key={i} href={k.href} className="font-semibold text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand">
              {k.label}
            </Link>
          ) : (
            <a key={i} href={k.href} target={k.href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="font-semibold text-brand underline underline-offset-2">
              {k.label}
            </a>
          )
        ) : k.t === "mail" ? (
          <a key={i} href={`mailto:${k.v}`} className="text-brand underline underline-offset-2">
            {k.v}
          </a>
        ) : k.t === "bold" ? (
          <strong key={i}>{k.v}</strong>
        ) : (
          <Fragment key={i}>{k.v}</Fragment>
        ),
      )}
    </>
  );
}

/** Paragraphs and bullet lists from plain reply text. */
export function EnyoText({ text }: { text: string }) {
  const blocks: { kind: "p" | "ul" | "ol"; lines: string[] }[] = [];
  let gap = true;
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const num = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const lastB = blocks.at(-1);
    if (bullet || num) {
      const kind = bullet ? "ul" : "ol";
      const item = (bullet ?? num)![1];
      if (lastB?.kind === kind) lastB.lines.push(item);
      else blocks.push({ kind, lines: [item] });
      gap = false;
    } else if (!line.trim()) {
      gap = true;
    } else {
      if (lastB?.kind === "p" && !gap) lastB.lines.push(line);
      else blocks.push({ kind: "p", lines: [line] });
      gap = false;
    }
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.kind === "p" ? (
          <p key={i}>
            {b.lines.map((l, j) => (
              <Fragment key={j}>
                {j ? <br /> : null}
                <Line text={l} />
              </Fragment>
            ))}
          </p>
        ) : b.kind === "ul" ? (
          <ul key={i} className="space-y-1.5">
            {b.lines.map((l, j) => (
              <li key={j} className="flex gap-2">
                <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <span>
                  <Line text={l} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-brand">
            {b.lines.map((l, j) => (
              <li key={j}>
                <Line text={l} />
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}

/** The newest reply appears a few words at a time, like the assistant is writing it. */
export function TypedReply({ text, onStep }: { text: string; onStep?: () => void }) {
  const words = text.split(/(\s+)/);
  const [n, setN] = useState(() => (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? words.length : 0));
  useEffect(() => {
    if (n >= words.length) return;
    const t = setTimeout(() => {
      setN((x) => Math.min(words.length, x + 3));
      onStep?.();
    }, 28);
    return () => clearTimeout(t);
  }, [n, words.length, onStep]);
  const shown = words.slice(0, n).join("");
  return (
    <>
      <EnyoText text={shown} />
      {n < words.length ? <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-brand align-middle" aria-hidden /> : null}
    </>
  );
}

/** "Enyo is thinking" with a soft shimmer and bouncing dots. */
export function Thinking({ label }: { label: string }) {
  return (
    <div className="flex max-w-[85%] items-center gap-2.5 rounded-2xl rounded-bl-md bg-concrete px-3.5 py-2.5" role="status" aria-label={label}>
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((k) => (
          <span key={k} className="h-2 w-2 animate-bounce rounded-full bg-brand/70" style={{ animationDelay: `${k * 140}ms` }} />
        ))}
      </span>
      <span className="enyo-shimmer text-sm font-medium">{label}</span>
    </div>
  );
}
