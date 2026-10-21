"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { shareTestimonial, type ShareState } from "./actions";

export function ShareForm({ companyName }: { companyName: string }) {
  const [state, action, pending] = useActionState<ShareState, FormData>(shareTestimonial, { status: "idle" });
  const [t, setT] = useState(0);
  const [rating, setRating] = useState(5);
  useEffect(() => setT(Date.now()), []);
  const v = state.status === "error" ? state.values : ({} as Record<string, string>);

  if (state.status === "sent") {
    return (
      <div role="status" className="card border-2 !border-brand p-8">
        <p className="heading text-2xl">Thank you for sharing.</p>
        <p className="mt-2 text-ink-soft">Our team reads every message before it goes on the site. Yours will appear once it has been approved.</p>
        <Link href="/" className="btn btn-outline mt-6">
          Back to home
        </Link>
      </div>
    );
  }
  return (
    <form key={state.status === "error" ? state.at : "fresh"} action={action} className="card grid gap-5 p-6 sm:p-8" noValidate>
      {state.status === "error" ? (
        <p role="alert" className="rounded-xl border-l-4 border-danger bg-concrete px-4 py-3 text-danger">
          {state.message}
        </p>
      ) : null}
      <input type="hidden" name="_t" value={t} />
      <div aria-hidden className="absolute -left-[9999px]">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <fieldset>
        <legend className="mb-2 font-semibold">Your rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((k) => (
            <label key={k} className="cursor-pointer" title={`${k} star${k > 1 ? "s" : ""}`}>
              <input type="radio" name="rating" value={k} className="sr-only" checked={rating === k} onChange={() => setRating(k)} />
              <svg width="32" height="32" viewBox="0 0 24 24" fill={k <= rating ? "#f5b301" : "none"} stroke="#f5b301" strokeWidth="1.6" aria-hidden>
                <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">{k} stars</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Your experience</span>
        <textarea name="quote" className="input" required maxLength={800} defaultValue={v.quote} placeholder="What did we supply or fix, and how did it go?" />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">
          <span>Full name</span>
          <input name="name" className="input" required maxLength={80} defaultValue={v.name} autoComplete="name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" className="input" required defaultValue={v.email} autoComplete="email" />
          <small>Never shown on the site.</small>
        </label>
        <label className="field">
          <span>Job title (optional)</span>
          <input name="role" className="input" maxLength={80} defaultValue={v.role} autoComplete="organization-title" />
        </label>
        <label className="field">
          <span>Company (optional)</span>
          <input name="company" className="input" maxLength={120} defaultValue={v.company} autoComplete="organization" />
        </label>
      </div>
      <label className="flex gap-3 text-[0.95rem]">
        <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[var(--brand)]" defaultChecked={v.consent === "on"} />
        <span>
          {companyName} may publish my words, name, job title and company on its website. I can ask for them to be removed at any time.
        </span>
      </label>
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Sending…" : "Send for review"}
        </button>
      </div>
    </form>
  );
}
