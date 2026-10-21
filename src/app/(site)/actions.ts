"use server";
import { z } from "zod";
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

export async function submitEnquiry(_: FormState, form: FormData): Promise<FormState> {
  if (looksLikeBot(form)) return { status: "sent", ref: "—", desk: "" };
  if (!(await rateLimit(`enq:${await clientKey()}`, 6, 10 * 60_000))) {
    return { status: "error", message: "Too many requests from this connection. Please wait a few minutes and try again.", values: echo(form), at: Date.now() };
  }

  const payload = {
    type: str(form, "type") ?? "GENERAL",
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
  const check = enquiryInput.safeParse(payload);
  if (!check.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields. If you attached photos, add them again.",
      errors: z.flattenError(check.error).fieldErrors as Record<string, string[]>,
      values: echo(form),
      at: Date.now(),
    };
  }

  if (looksLikeSpam(payload.message)) {
    return { status: "error", message: "Please remove web links and code from your message, then send it again.", errors: { message: ["Please remove links from your message."] }, values: echo(form), at: Date.now() };
  }

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 4);
  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > 12 * 1024 * 1024) {
    return { status: "error", message: "The photos add up to more than 12 MB. Please send fewer or smaller photos.", errors: { photos: ["Too large in total."] }, values: echo(form), at: Date.now() };
  }
  if (files.length && !(await rateLimit(`uploads:${await clientKey()}`, 20, 24 * 3600_000))) {
    return { status: "error", message: "You've sent a lot of photos today. Please send this request without photos, or call us.", values: echo(form), at: Date.now() };
  }
  const attachmentIds: string[] = [];
  for (const f of files) {
    const r = await saveUpload(f, { allowed: ALLOWED_UPLOADS, isPrivate: true });
    if (!r.ok) return { status: "error", message: r.error, errors: { photos: [r.error] }, values: echo(form), at: Date.now() };
    attachmentIds.push(r.id);
  }

  const result = await createEnquiry(payload, { source: "FORM", attachmentIds });

  if (!result.ok) {
    return {
      status: "error",
      message: "Please check the highlighted fields. If you attached photos, add them again.",
      errors: result.errors as Record<string, string[]>,
      values: echo(form),
      at: Date.now(),
    };
  }
  return { status: "sent", ref: result.ref, desk: result.desk.label, deskPhone: result.desk.phone || undefined };
}
