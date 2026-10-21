"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { EnyoAvatar } from "@/components/ejo/EnyoAvatar";
import { ENYO_ASK } from "./enyo-events";

type Msg = { role: "user" | "assistant"; content: string };
export type EnyoContact = { legalName: string; phone: string; whatsapp: string; email: string; address: string; hours: string };
const KEY = "cn_enyo";

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "").replace(/^0/, "+234")}`;
const wa = (p: string) => `https://wa.me/${p.replace(/\D/g, "").replace(/^0/, "234")}`;

/** Turns site paths (/book-service) and emails in replies into links. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\s\/[a-z0-9\-/#?=&]+|[\w.+-]+@[\w-]+\.[\w.]+)/gi);
  return (
    <>
      {parts.map((p, i) => {
        const t = p.trim();
        if (/^\/[a-z0-9]/i.test(t)) {
          const clean = t.replace(/[.,]$/, "");
          return (
            <Fragment key={i}>
              {" "}
              <Link href={clean} className="font-semibold text-brand underline underline-offset-2">
                {clean}
              </Link>
              {/[.,]$/.test(t) ? t.slice(-1) : ""}
            </Fragment>
          );
        }
        if (/^[\w.+-]+@/.test(t))
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

export function Enyo({ name, greeting, contact }: { name: string; greeting: string; contact: EnyoContact }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "contact">("chat");
  const [accepted, setAccepted] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [error, setError] = useState<string>();
  const [nudge, setNudge] = useState(false);
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
      if (!sessionStorage.getItem("cn_enyo_nudged")) {
        const t = setTimeout(() => setNudge(true), 6000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const ask = (e: Event) => {
      setOpen(true);
      setView("chat");
      setInput((e as CustomEvent<string>).detail);
      setTimeout(() => inputRef.current?.focus(), 60);
    };
    window.addEventListener(ENYO_ASK, ask);
    return () => window.removeEventListener(ENYO_ASK, ask);
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ sessionId, msgs: msgs.slice(-40), accepted }));
    } catch {}
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [sessionId, msgs, accepted, handoff, busy]);

  useEffect(() => {
    if (!open) return;
    setNudge(false);
    try {
      sessionStorage.setItem("cn_enyo_nudged", "1");
    } catch {}
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

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

  const mood = busy ? "thinking" : msgs.at(-1)?.role === "assistant" ? "happy" : "idle";

  return (
    <>
      {!open ? (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          {nudge ? (
            <div className="pop relative max-w-[16rem] rounded-2xl rounded-br-md border border-line bg-surface p-3.5 text-sm text-ink shadow-xl">
              <button type="button" onClick={() => setNudge(false)} className="absolute right-1.5 top-1 px-1 text-ink-soft" aria-label="Dismiss">
                ×
              </button>
              Hi, I&apos;m {name}. Need a quote, a technician or parts? I can help.
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-14 items-center gap-2 rounded-full bg-brand pl-1.5 pr-5 font-semibold text-on-brand shadow-[0_10px_28px_-10px_rgba(22,163,74,0.7)] transition hover:scale-[1.03]"
            aria-label={`Ask ${name}, our assistant`}
          >
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/95">
              <EnyoAvatar mood="wave" size={44} />
            </span>
            Ask {name}
          </button>
        </div>
      ) : null}

      {open ? (
        <section
          role="dialog"
          aria-label={`${name} chat`}
          className="pop fixed inset-0 z-[70] flex flex-col overflow-hidden bg-surface text-ink sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(660px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-[var(--ejo-radius-xl)] sm:border sm:border-line sm:shadow-2xl"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <header className="flex items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--surface)_90%,var(--brand))] px-4 py-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--enyo-av-bg)]">
              <EnyoAvatar mood={mood} size={48} />
            </span>
            <div className="min-w-0">
              <p className="heading leading-tight">{name}</p>
              <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" aria-hidden />
                AI assistant, replies straight away
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {contact.phone ? (
                <a href={tel(contact.phone)} className="grid h-10 w-10 place-items-center rounded-full text-brand hover:bg-brand/10" aria-label={`Call ${contact.phone}`} title="Call us">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
                  </svg>
                </a>
              ) : null}
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-concrete" aria-label="Close chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex gap-1 border-b border-line px-3 pt-2" role="tablist">
            {(["chat", "contact"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${view === v ? "border-b-2 border-brand text-brand" : "text-ink-soft hover:text-ink"}`}
              >
                {v === "chat" ? "Chat" : "Contact us"}
              </button>
            ))}
          </div>

          {view === "contact" ? (
            <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-sm text-ink-soft">Prefer a person? Reach our team directly.</p>
              {[
                contact.phone && { href: tel(contact.phone), title: "Call us", text: contact.phone, d: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" },
                contact.whatsapp && { href: wa(contact.whatsapp), title: "WhatsApp", text: contact.whatsapp, d: "M3 21l1.7-5A9 9 0 1 1 8 19.3zM9 9c0 3 3 6 6 6l1.5-1.5-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2Z", ext: true },
                contact.email && { href: `mailto:${contact.email}`, title: "Email", text: contact.email, d: "M3 6h18v12H3zM3 7l9 6 9-6" },
                contact.address && {
                  href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
                  title: "Visit us",
                  text: contact.address,
                  d: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
                  ext: true,
                },
              ]
                .filter(Boolean)
                .map((c) => {
                  const item = c as { href: string; title: string; text: string; d: string; ext?: boolean };
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.ext ? "_blank" : undefined}
                      rel={item.ext ? "noopener noreferrer" : undefined}
                      className="card card-hover flex items-center gap-4 p-4"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d={item.d} />
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{item.title}</span>
                        <span className="block break-words text-sm text-ink-soft">{item.text}</span>
                      </span>
                    </a>
                  );
                })}
              <div className="rounded-xl bg-concrete p-4 text-sm">
                <p className="font-semibold">{contact.legalName}</p>
                {contact.hours ? <p className="mt-1 text-ink-soft">{contact.hours}</p> : null}
              </div>
              <Link href="/book-service" className="btn btn-primary w-full">
                Book a technician
              </Link>
            </div>
          ) : !accepted ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-[0.95rem]">
              <div className="flex justify-center py-2">
                <span className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-[var(--enyo-av-bg)]">
                  <EnyoAvatar mood="wave" size={112} />
                </span>
              </div>
              <p>{greeting}</p>
              <p className="text-ink-soft">
                {name} is an automated assistant. Conversations are saved so our team can follow up, as described in our{" "}
                <Link href="/privacy" className="text-brand underline">
                  privacy notice
                </Link>
                . Please don&apos;t share bank or ID details.
              </p>
              <button type="button" className="btn btn-primary w-full" onClick={() => setAccepted(true)}>
                Start chat
              </button>
              <button type="button" className="btn btn-outline w-full" onClick={() => setView("contact")}>
                Talk to a person instead
              </button>
            </div>
          ) : (
            <>
              <div ref={list} className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-concrete px-3.5 py-2.5 text-[0.95rem]">{greeting}</p>
                {msgs.map((m, i) => (
                  <p
                    key={i}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[0.95rem] ${
                      m.role === "user" ? "ml-auto rounded-br-md bg-brand text-on-brand" : "rounded-bl-md bg-concrete"
                    }`}
                  >
                    {m.role === "assistant" ? <Rich text={m.content} /> : m.content}
                  </p>
                ))}
                {busy ? (
                  <p className="inline-flex gap-1 rounded-2xl bg-concrete px-4 py-3" aria-label={`${name} is typing`}>
                    {[0, 1, 2].map((k) => (
                      <span key={k} className="h-2 w-2 animate-bounce rounded-full bg-ink-soft" style={{ animationDelay: `${k * 120}ms` }} />
                    ))}
                  </p>
                ) : null}
                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}

                {handoff ? (
                  <form
                    className="grid gap-2 rounded-2xl border border-line p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitHandoff(e.currentTarget);
                    }}
                  >
                    <p className="text-sm font-semibold">Leave your details and our team will reply by email.</p>
                    <input name="name" required placeholder="Full name" className="input" autoComplete="name" maxLength={120} />
                    <input name="email" type="email" required placeholder="Email" className="input" autoComplete="email" maxLength={200} />
                    <input name="phone" type="tel" placeholder="Phone (optional)" className="input" autoComplete="tel" maxLength={40} />
                    <textarea name="message" required placeholder="What do you need?" className="input min-h-20" maxLength={2000} />
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
                  <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto text-sm">
                    {msgs.length === 0
                      ? ["How do I book a technician?", "Which forklift for a warehouse?", "Where are you located?"].map((q) => (
                          <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-line px-3 py-1.5 hover:border-brand">
                            {q}
                          </button>
                        ))
                      : null}
                    <button type="button" onClick={() => setHandoff(true)} className="shrink-0 rounded-full border border-line px-3 py-1.5 font-semibold text-brand hover:border-brand">
                      Leave a request
                    </button>
                    <button type="button" onClick={() => setView("contact")} className="shrink-0 rounded-full border border-line px-3 py-1.5 font-semibold text-brand hover:border-brand">
                      Talk to a person
                    </button>
                  </div>
                ) : null}
                <form
                  className="flex items-end gap-2"
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
                  <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand disabled:opacity-50" disabled={busy || !input.trim()} aria-label="Send">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
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
