"use server";
import { z } from "zod";
import { siteContent } from "@/components/site/site-content";
import { createEnquiry, enquiryInput } from "@/lib/enquiries";
import { ALLOWED_UPLOADS, clientKey, looksLikeBot, looksLikeSpam, rateLimit } from "@/lib/guard";
import { saveUpload } from "@/lib/media";

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Record<string, string[] | undefined>; values: Record<string, string>; at: number }
  | { status: "sent"; ref: string; desk: string; deskPhone?: string };

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v : undefined;
};

/** React clears the form after an action, so failed submissions hand back what was typed. */
function echo(form: FormData) {
  const v: Record<string, string> = {};
  for (const [k, val] of form.entries()) if (typeof val === "string" && !k.startsWith("$") && k !== "_t") v[k] = val;
  return v;
}

/** Which "forms" page message replaces the validator's wording for each field. */
const FIELD_MESSAGE: Record<string, string> = {
  name: "nameError",
  email: "emailError",
  phone: "phoneError",
  message: "messageError",
  consent: "consentError",
  type: "typeError",
  categorySlug: "lineError",
};

export async function submitEnquiry(_: FormState, form: FormData): Promise<FormState> {
  const L = await siteContent("forms");
  const fail = (message: string, errors?: Record<string, string[]>): FormState => ({ status: "error", message, errors, values: echo(form), at: Date.now() });

  if (looksLikeBot(form)) return { status: "sent", ref: "—", desk: "" };
  if (!(await rateLimit(`enq:${await clientKey()}`, 6, 10 * 60_000))) return fail(L.t("errorTooMany"));

  const kind = str(form, "_form");
  const filled = (k: string) => !!str(form, k)?.trim();

  const payload = {
    type: str(form, "type") || "",
    name: str(form, "name") ?? "",
    email: str(form, "email") ?? "",
    phone: str(form, "phone"),
    company: str(form, "company"),
    message: str(form, "message") ?? "",
    productSlug: str(form, "product"),
    categorySlug: str(form, "category"),
    details: {
      machine: str(form, "machine"),
      serialNumber: str(form, "serialNumber"),
      hourMeter: str(form, "hourMeter"),
      siteLocation: str(form, "siteLocation"),
      siteState: str(form, "siteState"),
      urgency: (str(form, "urgency") || undefined) as "machine_down" | "soon" | "planned" | undefined,
      preferredDate: str(form, "preferredDate"),
      partNumbers: str(form, "partNumbers"),
      quantity: str(form, "quantity"),
    },
    consent: form.get("consent") === "on",
  };

  // Check the fields before storing any photos, so failed attempts leave nothing behind.
  // Nothing is pre-selected in the forms, so the choices each form needs are checked here.
  const errors: Record<string, string[]> = {};
  const check = enquiryInput.safeParse(payload);
  if (!check.success) {
    for (const [k, msgs] of Object.entries(z.flattenError(check.error).fieldErrors as Record<string, string[] | undefined>)) {
      if (!msgs?.length) continue;
      const key = k === "categorySlug" ? "category" : k;
      errors[key] = [FIELD_MESSAGE[k] ? L.t(FIELD_MESSAGE[k]) : msgs[0]];
    }
  }
  if (kind === "contact" && !["QUOTE", "GENERAL", "CALLBACK"].includes(payload.type)) errors.type = [L.t("typeError")];
  if (!filled("phone")) errors.phone = [L.t("phoneRequiredError")];
  if (kind === "service" || kind === "parts") {
    if (!filled("category")) errors.category = [L.t("lineError")];
  }
  if (kind === "service") {
    if (!filled("siteLocation")) errors.siteLocation = [L.t("siteError")];
    if (!payload.details.urgency) errors.urgency = [L.t("urgencyError")];
  }
  // A failed check on nested machine details has no field of its own; show it on the message.
  if (errors.details) {
    errors.message ??= errors.details;
    delete errors.details;
  }
  if (Object.keys(errors).length) return fail(L.t("errorGeneric"), errors);

  if (looksLikeSpam(payload.message)) return fail(L.t("errorLinks"), { message: [L.t("errorLinksField")] });

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 4);
  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > 12 * 1024 * 1024) return fail(L.t("errorPhotosSize"), { photos: [L.t("errorPhotosField")] });
  if (files.length && !(await rateLimit(`uploads:${await clientKey()}`, 20, 24 * 3600_000, { cost: files.length }))) return fail(L.t("errorPhotosDaily"));
  const attachmentIds: string[] = [];
  for (const f of files) {
    const r = await saveUpload(f, { allowed: ALLOWED_UPLOADS, isPrivate: true });
    if (!r.ok) return fail(r.error, { photos: [r.error] });
    attachmentIds.push(r.id);
  }

  const result = await createEnquiry(payload, { source: "FORM", attachmentIds });

  if (!result.ok) {
    const errs: Record<string, string[]> = {};
    for (const [k, msgs] of Object.entries((result.errors ?? {}) as Record<string, string[] | undefined>)) {
      if (msgs?.length) errs[k === "categorySlug" ? "category" : k] = [FIELD_MESSAGE[k] ? L.t(FIELD_MESSAGE[k]) : msgs[0]];
    }
    return fail(L.t("errorGeneric"), errs);
  }
  return { status: "sent", ref: result.ref, desk: result.desk.label, deskPhone: result.desk.phone || undefined };
}
