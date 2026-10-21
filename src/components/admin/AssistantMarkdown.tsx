"use client";
// A small, safe Markdown subset for assistant answers: paragraphs, headings, lists, code blocks,
// bold, italics, inline code and links. Everything becomes React text, so HTML in an answer shows
// as text. Dashboard links open in place; https links open in a new tab; anything else is plain text.
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type Block = { t: "p"; text: string } | { t: "h"; text: string } | { t: "ul"; items: string[] } | { t: "ol"; items: string[]; start?: number } | { t: "code"; text: string };

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ t: "p", text: para.join("\n") });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      flush();
      const body: string[] = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) body.push(lines[i]);
      out.push({ t: "code", text: body.join("\n") });
      continue;
    }
    const h = /^\s{0,3}#{1,6}\s+(.*)$/.exec(line);
    if (h) {
      flush();
      out.push({ t: "h", text: h[1] });
      continue;
    }
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ol = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flush();
      const kind = ul ? "ul" : "ol";
      const last = out.at(-1);
      const text = ul ? ul[1] : ol![2];
      if (last && last.t === kind) last.items.push(text);
      else out.push(kind === "ul" ? { t: "ul", items: [text] } : { t: "ol", items: [text], start: Number(ol![1]) });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    // A wrapped line belongs to the list item above it.
    const last = out.at(-1);
    if (!para.length && last && (last.t === "ul" || last.t === "ol") && /^\s{2,}\S/.test(line)) {
      last.items[last.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    para.push(line);
  }
  flush();
  return out;
}

function safeLink(href: string): { href: string; internal: boolean } | null {
  if (/^\/(?!\/)[^\s]*$/.test(href)) return { href, internal: true };
  if (/^https:\/\/[^\s"'<>]+$/i.test(href)) return { href, internal: false };
  if (/^mailto:[^\s"'<>]+$/i.test(href)) return { href, internal: false };
  return null;
}

const INLINE = /(\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_)/;

function inline(text: string, onNavigate?: () => void, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let n = 0;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index) out.push(rest.slice(0, m.index));
    const k = `${key}-${n++}`;
    if (m[2] || m[3]) out.push(<strong key={k} className="font-semibold text-ink">{inline(m[2] || m[3], onNavigate, k)}</strong>);
    else if (m[4]) out.push(<code key={k} className="rounded bg-concrete px-1 py-px font-mono text-[0.9em]">{m[4]}</code>);
    else if (m[5]) {
      const safe = safeLink(m[6]);
      const cls = "font-semibold text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand";
      out.push(
        !safe ? (
          <Fragment key={k}>{m[5]}</Fragment>
        ) : safe.internal ? (
          <Link key={k} href={safe.href} onClick={onNavigate} className={cls}>
            {m[5]}
          </Link>
        ) : (
          <a key={k} href={safe.href} target="_blank" rel="noopener noreferrer nofollow" className={cls}>
            {m[5]}
          </a>
        ),
      );
    } else if (m[7] || m[8]) out.push(<em key={k}>{m[7] || m[8]}</em>);
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

export function AssistantMarkdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-2.5 break-words [overflow-wrap:anywhere]">
      {parseBlocks(text).map((b, i) => {
        if (b.t === "p") return <p key={i} className="whitespace-pre-line">{inline(b.text, onNavigate, `p${i}`)}</p>;
        if (b.t === "h") return <p key={i} className="pt-1 font-bold text-ink">{inline(b.text, onNavigate, `h${i}`)}</p>;
        if (b.t === "code")
          return (
            <pre key={i} className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-concrete px-3 py-2 font-mono text-xs">
              {b.text}
            </pre>
          );
        if (b.t === "ul")
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-brand">
              {b.items.map((it, j) => (
                <li key={j}>{inline(it, onNavigate, `u${i}-${j}`)}</li>
              ))}
            </ul>
          );
        return (
          <ol key={i} start={b.start} className="list-decimal space-y-1 pl-5 marker:text-ink-soft">
            {b.items.map((it, j) => (
              <li key={j}>{inline(it, onNavigate, `o${i}-${j}`)}</li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

/** The answer as plain text for the clipboard: Markdown marks removed, links as "text (address)". */
export function plainText(md: string) {
  return md
    .replace(/^\s*```.*$/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, t: string, h: string) => (h.startsWith("/") ? t : `${t} (${h})`))
    .replace(/(^|\s)\*([^*\s][^*]*)\*/g, "$1$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
