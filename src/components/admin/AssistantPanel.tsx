"use client";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { EnyoAvatar, type EnyoMood } from "@/components/ejo/EnyoAvatar";
import { Icon } from "@/components/ui/Icon";
import { AssistantMarkdown, plainText } from "./AssistantMarkdown";

/**
 * The dashboard assistant: a launcher at the bottom right (above the phone tab bar) and a chat
 * sheet, a panel on the right on wide screens and full screen on phones. The conversation stays in
 * this browser tab (sessionStorage) and carries on across pages. Ctrl/Cmd+J opens and closes it.
 */
type Turn = { key: string; role: "user" | "assistant"; text: string; state: "waiting" | "done" | "error"; used?: string[]; mode?: "ai" | "basic" };

const MAX_LEN = 4000;
const KEEP = 40;

const CSS = `
.cna-sheet{animation:cna-in .26s cubic-bezier(.2,.8,.2,1)}
.cna-scrim{animation:fade .2s ease}
.cna-launcher{transition:transform .2s ease,box-shadow .2s ease}
.cna-launcher:hover{transform:translateY(-2px)}
.cna-typing{display:inline-flex;gap:3px}
.cna-typing i{width:5px;height:5px;border-radius:50%;background:var(--brand);animation:cna-type 1.1s ease-in-out infinite}
.cna-typing i:nth-child(2){animation-delay:.15s}.cna-typing i:nth-child(3){animation-delay:.3s}
.cna-turn{animation:cna-turn .3s ease-out}
@keyframes cna-in{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
@media (max-width:639px){@keyframes cna-in{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}}
@keyframes cna-type{0%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
@keyframes cna-turn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.cna-sheet,.cna-scrim,.cna-typing i,.cna-turn{animation:none}.cna-launcher{transition:none}.cna-launcher:hover{transform:none}}
`;

const iconBtn =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-concrete hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand)]";

let seq = 0;
const newKey = () => `t${Date.now().toString(36)}${(seq += 1)}`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-ink-soft hover:bg-concrete hover:text-ink"
      aria-label={copied ? "Copied" : "Copy this answer"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(plainText(text));
          setCopied(true);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={15} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function AssistantPanel({ storageKey, firstName, name, aiReady, starters }: { storageKey: string; firstName: string; name: string; aiReady: boolean; starters: string[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [wave, setWave] = useState(false);
  const [happy, setHappy] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loaded = useRef(false);
  const busy = turns.some((t) => t.state === "waiting");
  const key = `cn_dash_assistant:${storageKey}`;

  // ---- keep the chat in this tab
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as Turn[];
        if (Array.isArray(saved)) setTurns(saved.filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.text === "string").map((t) => (t.state === "waiting" ? { ...t, state: "error", text: "This answer was interrupted." } : t)));
      }
    } catch {
      /* storage blocked: start fresh */
    }
    loaded.current = true;
  }, [key]);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(turns.slice(-KEEP)));
    } catch {
      /* storage full or blocked */
    }
  }, [turns, key]);

  // ---- open / close
  const openPanel = useCallback(() => {
    setOpen(true);
    setWave(true);
  }, []);
  const closePanel = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 30);
  }, []);
  useEffect(() => {
    if (!wave) return;
    const t = window.setTimeout(() => setWave(false), 2600);
    return () => window.clearTimeout(t);
  }, [wave]);
  useEffect(() => {
    if (!happy) return;
    const t = window.setTimeout(() => setHappy(false), 1800);
    return () => window.clearTimeout(t);
  }, [happy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        if (open) closePanel();
        else openPanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPanel, closePanel]);

  // Inside the sheet: Esc closes, Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const el = sheetRef.current;
    window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const list = Array.from(el.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), textarea:not([disabled])")).filter((n) => n.offsetParent !== null);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  // Newest message in view.
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, open]);

  // ---- asking
  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim().slice(0, MAX_LEN);
      if (!q || busy) return;
      const history = [...turns.filter((t) => t.state === "done").map((t) => ({ role: t.role, content: t.text.slice(0, 6000) })), { role: "user" as const, content: q }].slice(-20);
      const answerKey = newKey();
      setTurns((list) => [...list, { key: newKey(), role: "user", text: q, state: "done" }, { key: answerKey, role: "assistant", text: "", state: "waiting" }]);
      setInput("");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const patch = (p: Partial<Turn>) => setTurns((list) => list.map((t) => (t.key === answerKey ? { ...t, ...p } : t)));
      try {
        const res = await fetch("/api/admin/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history, path }),
          signal: ctrl.signal,
        });
        const json = (await res.json().catch(() => null)) as { reply?: string; mode?: "ai" | "basic"; used?: string[]; error?: string } | null;
        if (!res.ok || !json?.reply) {
          patch({ state: "error", text: json?.error || (res.status === 401 ? "Your session has ended. Sign in again to carry on." : "Something went wrong. Please try again.") });
          return;
        }
        patch({ state: "done", text: json.reply, used: json.used ?? [], mode: json.mode });
        setHappy(true);
      } catch (e) {
        if ((e as Error).name === "AbortError") patch({ state: "error", text: "Stopped." });
        else patch({ state: "error", text: "Couldn't reach the server. Check your connection and try again." });
      } finally {
        abortRef.current = null;
      }
    },
    [busy, turns, path],
  );

  const retry = (i: number) => {
    const prev = turns[i - 1];
    if (prev?.role !== "user" || busy) return;
    setTurns((list) => list.filter((_, j) => j !== i && j !== i - 1));
    void ask(prev.text);
  };

  const newChat = () => {
    abortRef.current?.abort();
    setTurns([]);
    setInput("");
    inputRef.current?.focus();
  };

  const onComposerKey = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void ask(input);
    }
  };

  // Following a dashboard link: on phones the sheet covers the page, so it closes.
  const onNavigate = () => {
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  };

  const mood: EnyoMood = busy ? "thinking" : wave ? "wave" : happy ? "happy" : "idle";

  return (
    <>
      <style href="cn-assistant" precedence="default">
        {CSS}
      </style>

      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-label={`Open ${name}, the dashboard assistant`}
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+J Meta+J"
          title={`${name} (Ctrl+J)`}
          className="cna-launcher fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full border-2 border-surface bg-surface shadow-[0_10px_28px_-10px_rgba(22,163,74,0.6),0_2px_6px_rgba(15,23,42,0.18)] ring-2 ring-brand/55 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)] print:hidden lg:right-6"
          style={{ bottom: "calc(var(--cna-bottom, 4.75rem) + env(safe-area-inset-bottom))" }}
        >
          <span className="pointer-events-none">
            <EnyoAvatar mood={wave ? "wave" : "idle"} size={50} />
          </span>
        </button>
      ) : null}
      {/* Above the phone tab bar; in the corner on wide screens. */}
      <style href="cn-assistant-pos" precedence="default">{`@media (min-width:1024px){:root{--cna-bottom:1.5rem}}`}</style>

      {open ? (
        <div className="fixed inset-0 z-[55] print:hidden">
          <div className="cna-scrim absolute inset-0 bg-[#06120a]/45 sm:bg-[#06120a]/20" onClick={closePanel} aria-hidden />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cna-title"
            className="cna-sheet absolute inset-0 flex flex-col bg-surface sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[440px] sm:border-l sm:border-line sm:shadow-[-24px_0_60px_-30px_rgba(6,18,10,0.5)]"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line bg-[color-mix(in_srgb,var(--surface)_92%,var(--brand))] pl-3 pr-1.5">
              <EnyoAvatar mood={mood} size={42} />
              <div className="min-w-0 flex-1">
                <h2 id="cna-title" className="truncate text-[15px] font-bold leading-tight">
                  {name}
                </h2>
                <p className="truncate text-xs text-ink-soft">{busy ? "Looking into it…" : aiReady ? "Dashboard assistant" : "Dashboard assistant · basic mode"}</p>
              </div>
              {turns.length ? (
                <button type="button" className={iconBtn} aria-label="New chat" title="New chat" onClick={newChat}>
                  <Icon name="new-chat" size={19} />
                </button>
              ) : null}
              <button type="button" className={iconBtn} aria-label={`Close ${name}`} title="Close (Esc)" onClick={closePanel}>
                <Icon name="x" size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="scroll-thin min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
              {turns.length === 0 ? (
                <div className="flex min-h-full flex-col px-5 pb-5 pt-8">
                  <div className="flex flex-col items-center text-center">
                    <EnyoAvatar mood={wave ? "wave" : "idle"} size={104} />
                    <p className="mt-4 text-lg font-bold">{firstName ? `Hello, ${firstName}. How can I help?` : "Hello. How can I help?"}</p>
                    <p className="mt-1.5 max-w-[34ch] text-sm text-ink-soft">I can explain how the dashboard works, draft text and look things up. I only see what your role can see, and I can&apos;t change anything.</p>
                    {!aiReady ? (
                      <p className="mt-4 max-w-[36ch] rounded-xl border border-line bg-concrete px-3.5 py-2.5 text-xs text-ink-soft">
                        Basic mode: I can point you to the right place and look up figures. Drafting text needs the AI connection, which your IT team can switch on.
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-auto pt-8">
                    <p id="cna-starters" className="mb-2 text-xs font-semibold text-ink-soft">
                      Try asking
                    </p>
                    <ul aria-labelledby="cna-starters" className="grid gap-2">
                      {starters.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => void ask(s)}
                            className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-line bg-concrete px-3.5 py-2 text-left text-sm transition-colors hover:border-brand/60"
                          >
                            {s}
                            <Icon name="arrow" size={15} className="shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <ol aria-label="Conversation" className="space-y-5 px-4 py-5">
                  {turns.map((t, i) => (
                    <li key={t.key} className="cna-turn">
                      {t.role === "user" ? (
                        <div className="flex justify-end">
                          <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[18px] rounded-br-md bg-brand/12 px-3.5 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere]">
                            <span className="sr-only">You asked: </span>
                            {t.text}
                          </p>
                        </div>
                      ) : t.state === "waiting" ? (
                        <p className="flex items-center gap-2 text-sm text-ink-soft" role="status">
                          <span className="cna-typing" aria-hidden>
                            <i />
                            <i />
                            <i />
                          </span>
                          <span className="ejo-shimmer-soft">Thinking</span>
                        </p>
                      ) : t.state === "error" ? (
                        <div role="alert" className="rounded-xl border border-danger/35 bg-danger/5 p-3 text-sm">
                          <p className="flex gap-2">
                            <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-danger" />
                            {t.text}
                          </p>
                          {i === turns.length - 1 && turns[i - 1]?.role === "user" ? (
                            <button type="button" onClick={() => retry(i)} className="ml-6 mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand px-3 text-xs font-semibold text-on-brand">
                              <Icon name="refresh" size={14} />
                              Try again
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed">
                          <div aria-live={i === turns.length - 1 ? "polite" : undefined}>
                            <AssistantMarkdown text={t.text} onNavigate={onNavigate} />
                          </div>
                          {t.used?.length ? (
                            <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="What I looked at">
                              {t.used.map((u) => (
                                <li key={u} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[11px] text-ink-soft">
                                  <Icon name="search" size={11} />
                                  {u}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <div className="-ml-2.5 mt-1 flex items-center">
                            <CopyButton text={t.text} />
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="shrink-0 border-t border-line bg-surface px-3 pb-3 pt-2.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask(input);
                }}
                className="flex items-end gap-1.5 rounded-[22px] border border-line bg-concrete p-1 pl-3.5 focus-within:border-brand/70"
              >
                <label htmlFor="cna-input" className="sr-only">
                  Ask {name}
                </label>
                <textarea
                  id="cna-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
                  onKeyDown={onComposerKey}
                  rows={1}
                  maxLength={MAX_LEN}
                  placeholder={`Ask ${name}…`}
                  className="max-h-36 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base leading-6 outline-none [field-sizing:content] placeholder:text-ink-soft sm:text-sm"
                />
                {busy ? (
                  <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-surface hover:opacity-90">
                    <Icon name="stop" size={15} />
                  </button>
                ) : (
                  <button type="submit" aria-label="Send" disabled={!input.trim()} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand transition-opacity hover:brightness-110 disabled:opacity-35">
                    <Icon name="arrow-up" size={19} strokeWidth={2.2} />
                  </button>
                )}
              </form>
              <p className="mt-1.5 px-2 text-[11px] text-ink-soft">Read-only. Check drafts and figures before you use them.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
