"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { submitEnquiry, type FormState } from "@/app/(site)/actions";
import { NG_STATES } from "@/lib/ng-states";



type ProductOption = { slug: string; name: string; brand: string | null; family: string; category: string; categorySlug: string };
type CategoryOption = { slug: string; name: string };

export function EnquiryForm({
  mode,
  products = [],
  categories = [],
  defaults = {},
  companyName,
}: {
  companyName: string;
  mode: "contact" | "service" | "parts";
  products?: ProductOption[];
  categories?: CategoryOption[];
  defaults?: { type?: string; product?: string; category?: string; machine?: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, { status: "idle" });
  const [startedAt, setStartedAt] = useState(0);
  useEffect(() => setStartedAt(Date.now()), []);
  const err = (k: string) => (state.status === "error" ? state.errors?.[k]?.[0] : undefined);
  // Values typed before a failed submit (React resets the form after every action).
  const v = state.status === "error" ? state.values : ({} as Record<string, string>);
  const val = (k: string, fallback?: string) => v[k] ?? fallback;

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-lg border-2 border-brand bg-surface p-8">
        <p className="heading text-2xl">Thank you. We have your request.</p>
        {state.ref !== "—" ? (
          <>
            <p className="mt-3 text-lg">
              Your reference is <strong className="num">{state.ref}</strong>.
            </p>
            <p className="mt-2 text-ink-soft">
              It has gone to our {state.desk.toLowerCase()} desk and a copy is on its way to your email.
              {state.deskPhone ? (
                <>
                  {" "}
                  If it&apos;s urgent, call <a className="text-brand underline" href={`tel:${state.deskPhone}`}>{state.deskPhone}</a>.
                </>
              ) : null}
            </p>
          </>
        ) : null}
        <Link href="/" className="btn btn-outline mt-6">
          Back to home
        </Link>
      </div>
    );
  }

  const grouped = products.reduce<Record<string, ProductOption[]>>((acc, p) => {
    (acc[`${p.category}: ${p.family}`] ??= []).push(p);
    return acc;
  }, {});

  return (
    <form key={state.status === "error" ? state.at : "fresh"} action={action} className="grid gap-6" noValidate>
      {state.status === "error" ? (
        <p role="alert" className="rounded border-l-4 border-danger bg-surface px-4 py-3 text-danger">
          {state.message}
        </p>
      ) : null}

      {/* Spam traps */}
      <input type="hidden" name="_t" value={startedAt} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Leave this empty <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {mode === "contact" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="field">
            <span>What do you need?</span>
            <select name="type" defaultValue={val("type", defaults.type ?? "GENERAL")} className="input">
              <option value="QUOTE">A quote for equipment</option>
              <option value="GENERAL">General question</option>
              <option value="CALLBACK">Please call me back</option>
            </select>
          </label>
          <label className="field">
            <span>Product (optional)</span>
            <select name="product" defaultValue={val("product", defaults.product ?? "")} className="input">
              <option value="">Not sure yet</option>
              {Object.entries(grouped).map(([g, list]) => (
                <optgroup key={g} label={g}>
                  {list.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {[p.brand, p.name].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {defaults.category ? <input type="hidden" name="category" value={defaults.category} /> : null}
        </div>
      ) : (
        <>
          <input type="hidden" name="type" value={mode === "service" ? "SERVICE_BOOKING" : "PARTS"} />
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="heading mb-3 text-xl">The machine</legend>
            <label className="field">
              <span>Equipment line</span>
              <select name="category" defaultValue={val("category", defaults.category ?? "")} className="input" required>
                <option value="" disabled>
                  Choose one
                </option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Make and model</span>
              <input name="machine" defaultValue={val("machine", defaults.machine)} className="input" placeholder="e.g. LiuGong 856H" />
            </label>
            <label className="field">
              <span>Serial number</span>
              <input name="serialNumber" defaultValue={val("serialNumber")} className="input" autoComplete="off" />
              <small>On the data plate, usually near the operator&apos;s seat or on the frame.</small>
            </label>
            {mode === "service" ? (
              <label className="field">
                <span>Hour meter reading</span>
                <input name="hourMeter" defaultValue={val("hourMeter")} inputMode="numeric" className="input num" placeholder="e.g. 4,250" />
              </label>
            ) : (
              <label className="field">
                <span>Quantity</span>
                <input name="quantity" defaultValue={val("quantity")} className="input" />
              </label>
            )}
          </fieldset>

          {mode === "service" ? (
            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="heading mb-3 text-xl">Where and when</legend>
              <label className="field sm:col-span-2">
                <span>Site location</span>
                <input name="siteLocation" defaultValue={val("siteLocation")} className="input" placeholder="Site name, address or nearest landmark" required />
                <small>A Google Maps link helps the technician find you.</small>
              </label>
              <label className="field">
                <span>State</span>
                <select name="siteState" defaultValue={val("siteState", "")} className="input">
                  <option value="">Choose a state</option>
                  {NG_STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Preferred date</span>
                <input type="date" name="preferredDate" defaultValue={val("preferredDate")} className="input" />
              </label>
              <div className="field sm:col-span-2">
                <span>How urgent is it?</span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ["machine_down", "Machine is down", "It can't work until it's fixed"],
                    ["soon", "This week", "Working, but needs attention"],
                    ["planned", "Planned service", "Routine maintenance"],
                  ].map(([v, t, d]) => (
                    <label
                      key={v}
                      className="flex cursor-pointer gap-3 rounded-md border-[1.5px] border-line bg-surface p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
                    >
                      <input type="radio" name="urgency" value={v} defaultChecked={val("urgency", "planned") === v} className="mt-1 accent-[var(--brand)]" />
                      <span>
                        <span className={`block font-semibold ${v === "machine_down" ? "text-[color-mix(in_oklab,var(--accent)_70%,var(--ink))]" : ""}`}>{t}</span>
                        <span className="block text-sm text-ink-soft">{d}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          ) : (
            <label className="field">
              <span>Part numbers or descriptions</span>
              <textarea name="partNumbers" defaultValue={val("partNumbers")} className="input" placeholder="One per line. If you don't have part numbers, describe the part." />
            </label>
          )}

          <label className="field">
            <span>Photos (optional)</span>
            <input type="file" name="photos" multiple accept="image/*,application/pdf" className="input py-2" />
            <small>Up to 4 files: the fault, the data plate or the part. JPG, PNG, WebP or PDF.</small>
            {err("photos") ? <small className="text-danger">{err("photos")}</small> : null}
          </label>
        </>
      )}

      <label className="field">
        <span>{mode === "service" ? "What's wrong?" : mode === "parts" ? "Anything else we should know?" : "Your message"}</span>
        <textarea
          name="message" defaultValue={val("message")}
          className="input"
          required
          aria-invalid={!!err("message")}
          placeholder={mode === "service" ? "Symptoms, warning lights or error codes, when it started" : undefined}
        />
        {err("message") ? <small className="text-danger">{err("message")}</small> : null}
      </label>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="heading mb-3 text-xl">Your details</legend>
        <label className="field">
          <span>Full name</span>
          <input name="name" defaultValue={val("name")} className="input" autoComplete="name" required aria-invalid={!!err("name")} />
          {err("name") ? <small className="text-danger">{err("name")}</small> : null}
        </label>
        <label className="field">
          <span>Company (optional)</span>
          <input name="company" defaultValue={val("company")} className="input" autoComplete="organization" />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" defaultValue={val("email")} className="input" autoComplete="email" required aria-invalid={!!err("email")} />
          {err("email") ? <small className="text-danger">{err("email")}</small> : <small>We send your reference number here.</small>}
        </label>
        <label className="field">
          <span>Phone {mode === "contact" ? "(optional)" : ""}</span>
          <input type="tel" name="phone" defaultValue={val("phone")} className="input" autoComplete="tel" required={mode !== "contact"} aria-invalid={!!err("phone")} />
          {err("phone") ? <small className="text-danger">{err("phone")}</small> : null}
        </label>
      </fieldset>

      <label className="flex gap-3 text-[0.95rem]">
        <input type="checkbox" name="consent" defaultChecked={val("consent") === "on"} className="mt-1 h-4 w-4 accent-[var(--brand)]" required />
        <span>
          I agree that {companyName} may use these details to respond to this request, as described in the{" "}
          <Link href="/privacy" className="text-brand underline">
            privacy notice
          </Link>
          .
          {err("consent") ? <span className="block text-danger">{err("consent")}</span> : null}
        </span>
      </label>

      <div>
        <button type="submit" className="btn btn-primary min-w-48" disabled={pending}>
          {pending ? "Sending…" : mode === "service" ? "Book the visit" : mode === "parts" ? "Send parts request" : "Send message"}
        </button>
      </div>
    </form>
  );
}
