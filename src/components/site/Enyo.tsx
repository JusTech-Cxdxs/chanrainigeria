"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { ENYO_ASK } from "./enyo-events";

type Msg = { role: "user" | "assistant"; content: string };
const KEY = "cn_enyo";

/** Turns site paths (/book-service) and emails in replies into links. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\s\/[a-z0-9\-/#?=&]+|[\w.+-]+@[\w-]+\.[\w.]+)/gi);
  return (
    <>
      {parts.map((p, i) => {
        const t = p.trim();
        if (/^\/[a-z0-9]/i.test(t))
          return (
            <Fragment key={i}>
              {" "}
              <Link href={t.replace(/[.,]$/, "")} className="font-semibold text-brand underline underline-offset-2">
                {t.replace(/[.,]$/, "")}
              </Link>
              {/[.,]$/.test(t) ? t.slice(-1) : ""}
            </Fragment>
          );
        if (/@/.test(t) && /^[\w.+-]+@/.test(t))
          return (
            <a key={i} href={`mailto:${t}`} className="text-brand underline">
              {t}
            </a>
          );
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export function Enyo({ name, greeting }: { name: string; greeting: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [error, setError] = useState<string>();
  const list = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (saved) {
        setSessionId(saved.sessionId);
        setMsgs(saved.msgs ?? []);
        setAccepted(!!saved.accepted);
      }
    } catch {}
    const ask = (e: Event) => {
      setOpen(true);
      setInput((e as CustomEvent<string>).detail);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener(ENYO_ASK, ask);
    return () => window.removeEventListener(ENYO_ASK, ask);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ sessionId, msgs: msgs.slice(-40), accepted }));
    } catch {}
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [sessionId, msgs, accepted, handoff]);

  async function post(body: object) {
    const res = await fetch("/api/enyo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, sessionId, page: path }) });
    const data = await res.json().catch(() => ({}));
    if (data.sessionId) setSessionId(data.sessionId);
    return { ok: res.ok, data };
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setError(undefined);
    setMsgs((m) => [...m, { role: "user", content: t }]);
    setInput("");
    setBusy(true);
    const { ok, data } = await post({ action: "message", message: t }).catch(() => ({ ok: false, data: {} as Record<string, string> }));
    setBusy(false);
    if (!ok) return setError(data.error || "I couldn't reach the server. Check your connection and try again.");
    setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
  }

  async function submitHandoff(form: HTMLFormElement) {
    const f = new FormData(form);
    setBusy(true);
    setError(undefined);
    const { ok, data } = await post({
      action: "handoff",
      name: String(f.get("name") || ""),
      email: String(f.get("email") || ""),
      phone: String(f.get("phone") || "") || undefined,
      message: String(f.get("message") || ""),
      consent: true,
    });
    setBusy(false);
    if (!ok) {
      const errs = data.errors ? Object.values(data.errors as Record<string, string[]>).flat().join(" ") : data.error;
      return setError(errs || "Please check your details.");
    }
    setHandoff(false);
    setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand shadow-lg hover:brightness-110 sm:bottom-6 sm:right-6"
          aria-label={`Ask ${name}, our assistant`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
          </svg>
          Ask {name}
        </button>
      ) : null}

      {open ? (
        <section
          role="dialog"
          aria-label={`${name} chat`}
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[min(40rem,calc(100dvh-1rem))] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem]"
        >
          <header className="flex items-center gap-3 border-b border-line bg-brand px-4 py-3 text-on-brand">
            <div>
              <p className="heading leading-tight">{name}</p>
              <p className="text-xs opacity-90">AI assistant · replies are automatic</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded px-2 py-1 text-sm font-semibold hover:bg-white/15" aria-label="Close chat">
              Close
            </button>
          </header>

          {!accepted ? (
            <div className="space-y-4 p-5 text-[0.95rem]">
              <p>{greeting}</p>
              <p className="text-ink-soft">
                {name} is an automated assistant. Conversations are saved so our team can follow up, and are handled as described
                in our{" "}
                <Link href="/privacy" className="text-brand underline">
                  privacy notice
                </Link>
                . Please don&apos;t share bank or ID details.
              </p>
              <button type="button" className="btn btn-primary w-full" onClick={() => setAccepted(true)}>
                Start chat
              </button>
            </div>
          ) : (
            <>
              <div ref={list} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                <p className="max-w-[85%] rounded-lg bg-concrete px-3 py-2 text-[0.95rem]">{greeting}</p>
                {msgs.map((m, i) => (
                  <p
                    key={i}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[0.95rem] ${m.role === "user" ? "ml-auto bg-brand text-on-brand" : "bg-concrete"}`}
                  >
                    {m.role === "assistant" ? <Rich text={m.content} /> : m.content}
                  </p>
                ))}
                {busy ? <p className="text-sm text-ink-soft">{name} is typing…</p> : null}
                {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

                {handoff ? (
                  <form
                    className="grid gap-2 rounded-lg border border-line p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitHandoff(e.currentTarget);
                    }}
                  >
                    <p className="text-sm font-semibold">Leave your details and our team will reply by email.</p>
                    <input name="name" required placeholder="Full name" className="input" autoComplete="name" />
                    <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" />
                    <input name="phone" type="tel" placeholder="Phone (optional)" className="input" autoComplete="tel" />
                    <textarea name="message" required placeholder="What do you need?" className="input min-h-20" />
                    <p className="text-xs text-ink-soft">By sending, you agree we can use these details to reply, as in our privacy notice.</p>
                    <div className="flex gap-2">
                      <button type="submit" className="btn btn-primary flex-1" disabled={busy}>
                        Send request
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setHandoff(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>

              <div className="border-t border-line p-3">
                {!handoff ? (
                  <div className="mb-2 flex flex-wrap gap-2 text-sm">
                    {msgs.length === 0
                      ? ["How do I book a technician?", "Which forklift for a warehouse?", "Where are you located?"].map((q) => (
                          <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-line px-3 py-1 hover:border-brand">
                            {q}
                          </button>
                        ))
                      : null}
                    <button type="button" onClick={() => setHandoff(true)} className="rounded-full border border-line px-3 py-1 font-semibold text-brand hover:border-brand">
                      Leave a request
                    </button>
                  </div>
                ) : null}
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                >
                  <label htmlFor="enyo-input" className="sr-only">
                    Message {name}
                  </label>
                  <textarea
                    id="enyo-input"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    rows={1}
                    maxLength={1500}
                    placeholder="Type your question"
                    className="input min-h-11 flex-1 resize-none"
                  />
                  <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      ) : null}
    </>
  );
}
