"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { submitEnquiry, type FormState } from "@/app/(site)/actions";
import { Icon } from "@/components/ui/Icon";
import { NG_STATES } from "@/lib/ng-states";
import { fill, withNode, type Labels } from "./fill";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";

type ProductOption = { slug: string; name: string; brand: string | null; family: string; category: string; categorySlug: string };
type CategoryOption = { slug: string; name: string };

/** One error line under a field, linked to it for screen readers. */
function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <small id={id} className="flex items-center gap-1.5 !text-danger">
      <Icon name="alert" size={14} className="shrink-0" />
      {text}
    </small>
  );
}

export function EnquiryForm({
  mode,
  labels: L,
  products = [],
  categories = [],
  defaults = {},
}: {
  mode: "contact" | "service" | "parts";
  /** The "forms" page text, filled (see siteContent().labels()) */
  labels: Labels;
  products?: ProductOption[];
  categories?: CategoryOption[];
  /** Presets from the address bar, e.g. /contact?type=QUOTE&product=x. Nothing is chosen otherwise. */
  defaults?: { type?: string; product?: string; category?: string; machine?: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, { status: "idle" });
  const [startedAt, setStartedAt] = useState(0);
  const [typeChosen, setTypeChosen] = useState(false);
  useEffect(() => setStartedAt(Date.now()), []);
  const err = (k: string) => (state.status === "error" ? state.errors?.[k]?.[0] : undefined);
  // Values typed before a failed submit (React resets the form after every action).
  const v = state.status === "error" ? state.values : ({} as Record<string, string>);
  const val = (k: string, fallback?: string) => v[k] ?? fallback;
  const invalid = (k: string) => (err(k) ? { "aria-invalid": true as const, "aria-describedby": `e-${k}` } : {});

  useEffect(() => {
    if (state.status !== "error") return;
    // Take keyboard and screen reader users to the first problem.
    const first = document.querySelector<HTMLElement>("[data-enquiry-form] [aria-invalid='true']");
    first?.focus({ preventScroll: true });
    document.querySelector("[data-enquiry-form] [role='alert']")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  if (state.status === "sent") {
    return (
      <div role="status" className="card relative overflow-hidden border-2 !border-brand p-8 sm:p-10">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-on-brand">
          <Icon name="check" size={28} strokeWidth={2.4} />
        </span>
        <p className="heading mt-5 text-2xl">{L.sentTitle}</p>
        {state.ref !== "—" ? (
          <>
            <p className="mt-3 text-lg">{withNode(L.sentRef, "ref", <strong className="num">{state.ref}</strong>)}</p>
            <p className="mt-2 text-ink-soft">
              {fill(L.sentDesk, { desk: state.desk.toLowerCase() })}
              {state.deskPhone ? (
                <>
                  {" "}
                  {withNode(
                    L.sentUrgent,
                    "phone",
                    <a className="num font-semibold text-brand-ink underline underline-offset-2" href={`tel:${state.deskPhone}`}>
                      {state.deskPhone}
                    </a>,
                  )}
                </>
              ) : null}
            </p>
          </>
        ) : null}
        <Link href={L.sentButtonLink || "/"} className="btn btn-outline mt-6">
          <Icon name="home" />
          {L.sentButton}
        </Link>
      </div>
    );
  }

  const productOptions: SelectOption[] = products.map((p) => ({
    value: p.slug,
    label: [p.brand, p.name].filter(Boolean).join(" "),
    group: `${p.category}: ${p.family}`,
  }));
  const lineOptions: SelectOption[] = categories.map((c) => ({ value: c.slug, label: c.name }));
  const stateOptions: SelectOption[] = NG_STATES.map((s) => ({ value: s, label: s }));
  const pick = { searchPlaceholder: L.searchPlaceholder, noMatches: L.noMatches, clearLabel: L.clearLabel };

  const urgencies: [string, string, string][] = [
    ["machine_down", L.urgentDownTitle, L.urgentDownText],
    ["soon", L.urgentSoonTitle, L.urgentSoonText],
    ["planned", L.urgentPlannedTitle, L.urgentPlannedText],
  ];

  return (
    <form key={state.status === "error" ? state.at : "fresh"} action={action} className="grid gap-6" noValidate data-enquiry-form>
      {state.status === "error" ? (
        <p role="alert" className="flex gap-3 rounded-xl border-l-4 border-danger bg-surface px-4 py-3 text-danger">
          <Icon name="alert" size={20} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      ) : null}

      {/* Which form this is, and spam traps */}
      <input type="hidden" name="_form" value={mode} />
      <input type="hidden" name="_t" value={startedAt} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          {L.spamLabel} <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {mode === "contact" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="field">
            <span>{L.typeLabel}</span>
            <span className="relative block">
              <select
                name="type"
                defaultValue={val("type", defaults.type ?? "")}
                onChange={(e) => setTypeChosen(!!e.target.value)}
                className={`input appearance-none pr-10 ${typeChosen || val("type", defaults.type) ? "" : "text-ink-soft"} ${err("type") ? "!border-danger" : ""}`}
                required
                {...invalid("type")}
              >
                <option value="" disabled>
                  {L.typePlaceholder}
                </option>
                <option value="QUOTE" className="text-ink">
                  {L.typeQuote}
                </option>
                <option value="GENERAL" className="text-ink">
                  {L.typeGeneral}
                </option>
                <option value="CALLBACK" className="text-ink">
                  {L.typeCallback}
                </option>
              </select>
              <Icon name="chevron-down" size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            </span>
            <FieldError id="e-type" text={err("type")} />
          </label>
          <div className="field">
            <span id="l-product">{L.productLabel}</span>
            <SearchableSelect
              name="product"
              labelledBy="l-product"
              options={productOptions}
              placeholder={L.productPlaceholder}
              defaultValue={val("product", defaults.product ?? "")}
              {...pick}
            />
          </div>
          {defaults.category ? <input type="hidden" name="category" value={defaults.category} /> : null}
        </div>
      ) : (
        <>
          <input type="hidden" name="type" value={mode === "service" ? "SERVICE_BOOKING" : "PARTS"} />
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="heading mb-3 text-xl">{L.machineLegend}</legend>
            <div className="field">
              <span id="l-category">{L.lineLabel}</span>
              <SearchableSelect
                name="category"
                labelledBy="l-category"
                describedBy={err("category") ? "e-category" : undefined}
                invalid={!!err("category")}
                required
                options={lineOptions}
                placeholder={L.linePlaceholder}
                defaultValue={val("category", defaults.category ?? "")}
                {...pick}
              />
              <FieldError id="e-category" text={err("category")} />
            </div>
            <label className="field">
              <span>{L.modelLabel}</span>
              <input name="machine" defaultValue={val("machine", defaults.machine)} className="input" placeholder={L.modelPlaceholder} />
            </label>
            <label className="field">
              <span>{L.serialLabel}</span>
              <input name="serialNumber" defaultValue={val("serialNumber")} className="input" autoComplete="off" />
              <small>{L.serialHelp}</small>
            </label>
            {mode === "service" ? (
              <label className="field">
                <span>{L.hoursLabel}</span>
                <input name="hourMeter" defaultValue={val("hourMeter")} inputMode="numeric" className="input num" placeholder={L.hoursPlaceholder} />
              </label>
            ) : (
              <label className="field">
                <span>{L.quantityLabel}</span>
                <input name="quantity" defaultValue={val("quantity")} className="input" />
              </label>
            )}
          </fieldset>

          {mode === "service" ? (
            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="heading mb-3 text-xl">{L.whereLegend}</legend>
              <label className="field sm:col-span-2">
                <span>{L.siteLabel}</span>
                <input
                  name="siteLocation"
                  defaultValue={val("siteLocation")}
                  className={`input ${err("siteLocation") ? "!border-danger" : ""}`}
                  placeholder={L.sitePlaceholder}
                  required
                  {...invalid("siteLocation")}
                />
                {err("siteLocation") ? <FieldError id="e-siteLocation" text={err("siteLocation")} /> : <small>{L.siteHelp}</small>}
              </label>
              <div className="field">
                <span id="l-state">{L.stateLabel}</span>
                <SearchableSelect name="siteState" labelledBy="l-state" options={stateOptions} placeholder={L.statePlaceholder} defaultValue={val("siteState", "")} {...pick} />
              </div>
              <label className="field">
                <span>{L.dateLabel}</span>
                <input type="date" name="preferredDate" defaultValue={val("preferredDate")} className="input" />
              </label>
              <fieldset className="field sm:col-span-2" {...(err("urgency") ? { "aria-describedby": "e-urgency" } : {})}>
                <legend className="mb-1.5 text-[0.9375rem] font-semibold">{L.urgencyLabel}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {urgencies.map(([key, t, d]) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer gap-3 rounded-xl border-[1.5px] bg-surface p-3 transition-colors hover:border-brand/60 has-[:checked]:border-brand has-[:checked]:bg-brand/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                        err("urgency") ? "border-danger" : "border-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name="urgency"
                        value={key}
                        required
                        defaultChecked={val("urgency") === key}
                        className="mt-1 accent-[var(--brand)]"
                      />
                      <span>
                        <span className={`block font-semibold ${key === "machine_down" ? "text-[color-mix(in_oklab,var(--accent)_70%,var(--ink))]" : ""}`}>{t}</span>
                        <span className="block text-sm text-ink-soft">{d}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <FieldError id="e-urgency" text={err("urgency")} />
              </fieldset>
            </fieldset>
          ) : (
            <label className="field">
              <span>{L.partsLabel}</span>
              <textarea name="partNumbers" defaultValue={val("partNumbers")} className="input" placeholder={L.partsPlaceholder} />
            </label>
          )}

          <label className="field">
            <span>{L.photosLabel}</span>
            <input type="file" name="photos" multiple accept="image/*,application/pdf" className="input py-2 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:font-semibold file:text-brand-ink" {...invalid("photos")} />
            {err("photos") ? <FieldError id="e-photos" text={err("photos")} /> : <small>{L.photosHelp}</small>}
          </label>
        </>
      )}

      <label className="field">
        <span>{mode === "service" ? L.faultLabel : mode === "parts" ? L.partsMessageLabel : L.messageLabel}</span>
        <textarea
          name="message"
          defaultValue={val("message")}
          className={`input ${err("message") ? "!border-danger" : ""}`}
          required
          placeholder={mode === "service" ? L.faultPlaceholder : undefined}
          {...invalid("message")}
        />
        <FieldError id="e-message" text={err("message")} />
      </label>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="heading mb-3 text-xl">{L.detailsLegend}</legend>
        <label className="field">
          <span>{L.nameLabel}</span>
          <input name="name" defaultValue={val("name")} className={`input ${err("name") ? "!border-danger" : ""}`} autoComplete="name" required {...invalid("name")} />
          <FieldError id="e-name" text={err("name")} />
        </label>
        <label className="field">
          <span>{L.companyLabel}</span>
          <input name="company" defaultValue={val("company")} className="input" autoComplete="organization" />
        </label>
        <label className="field">
          <span>{L.emailLabel}</span>
          <input type="email" name="email" defaultValue={val("email")} className={`input ${err("email") ? "!border-danger" : ""}`} autoComplete="email" required {...invalid("email")} />
          {err("email") ? <FieldError id="e-email" text={err("email")} /> : <small>{L.emailHelp}</small>}
        </label>
        <label className="field">
          <span>{mode === "contact" ? L.phoneOptionalLabel : L.phoneLabel}</span>
          <input
            type="tel"
            name="phone"
            defaultValue={val("phone")}
            className={`input ${err("phone") ? "!border-danger" : ""}`}
            autoComplete="tel"
            required={mode !== "contact"}
            {...invalid("phone")}
          />
          <FieldError id="e-phone" text={err("phone")} />
        </label>
      </fieldset>

      <label className="flex gap-3 text-[0.95rem]">
        <input type="checkbox" name="consent" defaultChecked={val("consent") === "on"} className="mt-1 h-4 w-4 shrink-0 accent-[var(--brand)]" required {...invalid("consent")} />
        <span>
          {withNode(
            L.consentText,
            "privacy",
            <Link href="/privacy" className="text-brand-ink underline underline-offset-2">
              {L.consentLink}
            </Link>,
          )}
          <FieldError id="e-consent" text={err("consent")} />
        </span>
      </label>

      <div>
        <button type="submit" className="btn btn-primary min-w-48" disabled={pending}>
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          ) : (
            <Icon name={mode === "service" ? "calendar" : mode === "parts" ? "package" : "send"} />
          )}
          {pending ? L.submitting : mode === "service" ? L.serviceSubmit : mode === "parts" ? L.partsSubmit : L.contactSubmit}
        </button>
      </div>
    </form>
  );
}
