"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EnyoAvatar } from "@/components/ejo/EnyoAvatar";
import { Icon } from "@/components/ui/Icon";
import { ENYO_ASK } from "./enyo-events";
import { EnyoText, Thinking, TypedReply } from "./EnyoText";
import { withNode, type Labels } from "./fill";

type Msg = { role: "user" | "assistant"; content: string };
export type EnyoContact = { legalName: string; phone: string; whatsapp: string; email: string; address: string; hours: string };
const KEY = "cn_enyo";

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, "").replace(/^0/, "+234")}`;
const wa = (p: string) => `https://wa.me/${p.replace(/\D/g, "").replace(/^0/, "234")}`;

/** Turns site paths (/request-service) and emails in replies into links. */
export function Enyo({
  name,
  greeting,
  contact,
  labels: L,
  suggestions,
}: {
  name: string;
  greeting: string;
  contact: EnyoContact;
  /** The "enyo" page text, with {enyo} already filled */
  labels: Labels;
  suggestions: string[];
}) {
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
  /** Index of the reply that just arrived, which is written out word by word. */
  const fresh = useRef(-1);
  const scrollDown = () => list.current?.scrollTo({ top: list.current.scrollHeight });
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
    if (!ok) return setError(data.error || L.errorNetwork);
    setMsgs((m) => {
      fresh.current = m.length;
      return [...m, { role: "assistant", content: data.reply }];
    });
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
      return setError(errs || L.handoffError);
    }
    setHandoff(false);
    setMsgs((m) => {
      fresh.current = m.length;
      return [...m, { role: "assistant", content: data.reply }];
    });
  }

  const mood = busy ? "thinking" : msgs.at(-1)?.role === "assistant" ? "happy" : "idle";

  return (
    <>
      {!open ? (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          {nudge ? (
            <div className="pop relative max-w-[16rem] rounded-2xl rounded-br-md border border-line bg-surface p-3.5 text-sm text-ink shadow-xl">
              <button type="button" onClick={() => setNudge(false)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full text-ink-soft hover:bg-concrete hover:text-ink" aria-label={L.dismiss}>
                <Icon name="x" size={14} />
              </button>
              <span className="block pr-4">{L.nudge}</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-14 items-center gap-2 rounded-full bg-brand pl-1.5 pr-5 font-semibold text-on-brand shadow-[0_10px_28px_-10px_rgba(22,163,74,0.7)] transition hover:scale-[1.03]"
            aria-label={L.launcherAria}
          >
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-white/95">
              <EnyoAvatar mood="wave" size={44} />
            </span>
            {L.launcher}
          </button>
        </div>
      ) : null}

      {open ? (
        <section
          role="dialog"
          aria-label={`${name}: ${L.tabChat}`}
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
                {L.status}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {contact.phone ? (
                <a href={tel(contact.phone)} className="grid h-10 w-10 place-items-center rounded-full text-brand-ink hover:bg-brand/10" aria-label={`${L.callAria}: ${contact.phone}`} title={L.callAria}>
                  <Icon name="phone" size={19} />
                </a>
              ) : null}
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-concrete" aria-label={L.closeChat}>
                <Icon name="x" size={20} />
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
                className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${view === v ? "border-b-2 border-brand text-brand-ink" : "text-ink-soft hover:text-brand-ink"}`}
              >
                {v === "chat" ? L.tabChat : L.tabContact}
              </button>
            ))}
          </div>

          {view === "contact" ? (
            <div className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4">
              <p className="text-sm text-ink-soft">{L.contactIntro}</p>
              {[
                contact.phone && { href: tel(contact.phone), title: L.callTitle, text: contact.phone, icon: "phone" },
                contact.whatsapp && { href: wa(contact.whatsapp), title: L.whatsappTitle, text: contact.whatsapp, icon: "whatsapp", ext: true },
                contact.email && { href: `mailto:${contact.email}`, title: L.emailTitle, text: contact.email, icon: "mail" },
                contact.address && {
                  href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
                  title: L.visitTitle,
                  text: contact.address,
                  icon: "pin",
                  ext: true,
                },
              ]
                .filter(Boolean)
                .map((c) => {
                  const item = c as { href: string; title: string; text: string; icon: string; ext?: boolean };
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.ext ? "_blank" : undefined}
                      rel={item.ext ? "noopener noreferrer" : undefined}
                      className="card card-hover flex items-center gap-4 p-4"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand-ink">
                        <Icon name={item.icon} size={20} />
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
              <Link href={L.bookLink || "/request-service"} className="btn btn-primary w-full">
                <Icon name="calendar" size={16} />
                {L.bookButton}
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
                {withNode(
                  L.consentText,
                  "privacy",
                  <Link href="/privacy" className="text-brand-ink underline">
                    {L.privacyLink}
                  </Link>,
                )}
              </p>
              <button type="button" className="btn btn-primary w-full" onClick={() => setAccepted(true)}>
                <Icon name="chat" size={16} />
                {L.startChat}
              </button>
              <button type="button" className="btn btn-outline w-full" onClick={() => setView("contact")}>
                <Icon name="users" size={16} />
                {L.talkPerson}
              </button>
            </div>
          ) : (
            <>
              <div ref={list} className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-concrete px-3.5 py-2.5 text-[0.95rem]">{greeting}</p>
                {msgs.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.95rem] [animation:rise_.25s_ease-out] ${
                      m.role === "user" ? "ml-auto whitespace-pre-wrap rounded-br-md bg-brand text-on-brand" : "rounded-bl-md bg-concrete"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      i === msgs.length - 1 && fresh.current === i ? (
                        <TypedReply text={m.content} onStep={scrollDown} />
                      ) : (
                        <EnyoText text={m.content} />
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                ))}
                {busy ? <Thinking label={L.typing} /> : null}
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
                    <p className="text-sm font-semibold">{L.handoffIntro}</p>
                    <input name="name" required placeholder={L.handoffName} aria-label={L.handoffName} className="input" autoComplete="name" maxLength={120} />
                    <input name="email" type="email" required placeholder={L.handoffEmail} aria-label={L.handoffEmail} className="input" autoComplete="email" maxLength={200} />
                    <input name="phone" type="tel" required placeholder={L.handoffPhone} aria-label={L.handoffPhone} className="input" autoComplete="tel" maxLength={40} />
                    <textarea name="message" required placeholder={L.handoffMessage} aria-label={L.handoffMessage} className="input min-h-20" maxLength={2000} />
                    <p className="text-xs text-ink-soft">{L.handoffConsent}</p>
                    <div className="flex gap-2">
                      <button type="submit" className="btn btn-primary flex-1" disabled={busy}>
                        <Icon name="send" size={16} />
                        {L.handoffSend}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setHandoff(false)}>
                        {L.handoffCancel}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>

              <div className="border-t border-line p-3">
                {!handoff ? (
                  <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto text-sm">
                    {msgs.length === 0
                      ? suggestions.map((q) => (
                          <button key={q} type="button" onClick={() => send(q)} className="shrink-0 rounded-full border border-line px-3 py-1.5 hover:border-brand hover:text-brand-ink">
                            {q}
                          </button>
                        ))
                      : null}
                    <button type="button" onClick={() => setHandoff(true)} className="shrink-0 rounded-full border border-line px-3 py-1.5 font-semibold text-brand-ink hover:border-brand">
                      {L.leaveRequest}
                    </button>
                    <button type="button" onClick={() => setView("contact")} className="shrink-0 rounded-full border border-line px-3 py-1.5 font-semibold text-brand-ink hover:border-brand">
                      {L.talkPersonChip}
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
                    {L.inputLabel}
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
                    placeholder={L.inputPlaceholder}
                    className="input min-h-11 flex-1 resize-none"
                  />
                  <button type="submit" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand disabled:opacity-50" disabled={busy || !input.trim()} aria-label={L.send}>
                    <Icon name="send" size={18} />
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
