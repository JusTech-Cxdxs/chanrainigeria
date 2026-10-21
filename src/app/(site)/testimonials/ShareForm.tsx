"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { fill, type Labels } from "@/components/site/fill";
import { Icon } from "@/components/ui/Icon";
import { shareTestimonial, type ShareState } from "./actions";

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <small id={id} className="flex items-center gap-1.5 !text-danger">
      <Icon name="alert" size={14} className="shrink-0" />
      {text}
    </small>
  );
}

/** Visitor testimonial. Nothing is pre-filled: the star rating has to be chosen. */
export function ShareForm({ labels: L }: { labels: Labels }) {
  const [state, action, pending] = useActionState<ShareState, FormData>(shareTestimonial, { status: "idle" });
  const [t, setT] = useState(0);
  const v = state.status === "error" ? state.values : ({} as Record<string, string>);
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => setT(Date.now()), []);
  // A failed send resets the form; keep the stars that were chosen.
  useEffect(() => {
    if (state.status === "error" && state.values.rating) setRating(Number(state.values.rating) || null);
  }, [state]);
  const err = (k: string) => (state.status === "error" ? state.errors?.[k] : undefined);
  const invalid = (k: string) => (err(k) ? { "aria-invalid": true as const, "aria-describedby": `te-${k}` } : {});
  const shown = hover ?? rating ?? 0;

  if (state.status === "sent") {
    return (
      <div role="status" className="card border-2 !border-brand p-8">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-on-brand">
          <Icon name="check" size={28} strokeWidth={2.4} />
        </span>
        <p className="heading mt-5 text-2xl">{L.tSentTitle}</p>
        <p className="mt-2 text-ink-soft">{L.tSentText}</p>
        <Link href={L.sentButtonLink || "/"} className="btn btn-outline mt-6">
          <Icon name="home" />
          {L.sentButton}
        </Link>
      </div>
    );
  }
  return (
    <form key={state.status === "error" ? state.at : "fresh"} action={action} className="card grid gap-5 p-6 sm:p-8" noValidate>
      {state.status === "error" ? (
        <p role="alert" className="flex gap-3 rounded-xl border-l-4 border-danger bg-concrete px-4 py-3 text-danger">
          <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      ) : null}
      <input type="hidden" name="_t" value={t} />
      <div aria-hidden className="absolute -left-[9999px]">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-label={L.spamLabel} />
      </div>
      <fieldset {...(err("rating") ? { "aria-describedby": "te-rating" } : {})}>
        <legend className="mb-2 font-semibold">{L.ratingLegend}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((k) => (
            <label key={k} className="cursor-pointer rounded-lg p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/50" onMouseEnter={() => setHover(k)}>
              <input
                type="radio"
                name="rating"
                value={k}
                className="sr-only"
                required
                checked={rating === k}
                onChange={() => setRating(k)}
              />
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                className={`transition-transform ${k <= shown ? "text-leaf" : err("rating") ? "text-danger/60" : "text-line"} ${hover === k ? "scale-110" : ""}`}
                fill={k <= shown ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">{k === 1 ? L.starOne : fill(L.starMany, { n: k })}</span>
            </label>
          ))}
        </div>
        <FieldError id="te-rating" text={err("rating")} />
      </fieldset>
      <label className="field">
        <span>{L.quoteLabel}</span>
        <textarea name="quote" className={`input ${err("quote") ? "!border-danger" : ""}`} required maxLength={800} defaultValue={v.quote} placeholder={L.quotePlaceholder} {...invalid("quote")} />
        <FieldError id="te-quote" text={err("quote")} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          <span>{L.nameLabel}</span>
          <input name="name" className={`input ${err("name") ? "!border-danger" : ""}`} required maxLength={80} defaultValue={v.name} autoComplete="name" {...invalid("name")} />
          <FieldError id="te-name" text={err("name")} />
        </label>
        <label className="field">
          <span>{L.emailLabel}</span>
          <input name="email" type="email" className={`input ${err("email") ? "!border-danger" : ""}`} required defaultValue={v.email} autoComplete="email" {...invalid("email")} />
          {err("email") ? <FieldError id="te-email" text={err("email")} /> : <small>{L.tEmailHelp}</small>}
        </label>
        <label className="field">
          <span>{L.roleLabel}</span>
          <input name="role" className="input" maxLength={80} defaultValue={v.role} autoComplete="organization-title" />
        </label>
        <label className="field">
          <span>{L.companyLabel}</span>
          <input name="company" className="input" maxLength={120} defaultValue={v.company} autoComplete="organization" />
        </label>
      </div>
      <label className="flex gap-3 text-[0.95rem]">
        <input type="checkbox" name="consent" className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" defaultChecked={v.consent === "on"} {...invalid("consent")} />
        <span>
          {L.tConsent}
          <FieldError id="te-consent" text={err("consent")} />
        </span>
      </label>
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : <Icon name="send" />}
          {pending ? L.submitting : L.tSubmit}
        </button>
      </div>
    </form>
  );
}
