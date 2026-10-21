"use server";
import { siteUrl } from "@/lib/site-url";
import { z } from "zod";
import { siteContent } from "@/components/site/site-content";
import { db, schema } from "@/db";
import { clientKey, looksLikeBot, looksLikeSpam, rateLimit } from "@/lib/guard";
import { testimonialNotice } from "@/lib/email-templates";
import { emailContext, sendMail, testimonialRecipients } from "@/lib/mail";

export type ShareState =
  | { status: "idle" }
  | { status: "error"; message: string; errors?: Record<string, string>; values: Record<string, string>; at: number }
  | { status: "sent" };

/** Visitor testimonials always wait for staff approval, so nothing appears on the site unchecked. */
export async function shareTestimonial(_: ShareState, form: FormData): Promise<ShareState> {
  const L = await siteContent("forms");
  const values: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && k !== "_t" && !k.startsWith("$")) values[k] = v;
  const err = (message: string, errors?: Record<string, string>): ShareState => ({ status: "error", message, errors, values, at: Date.now() });

  // Messages come from Dashboard → Pages and text → Forms.
  const input = z.object({
    name: z.string().trim().min(2, L.t("nameError")).max(80),
    role: z.string().trim().max(80).optional(),
    company: z.string().trim().max(120).optional(),
    email: z.string().trim().toLowerCase().email(L.t("tEmailError")).max(200),
    rating: z.coerce.number({ message: L.t("ratingError") }).int().min(1, L.t("ratingError")).max(5, L.t("ratingError")),
    quote: z.string().trim().min(20, L.t("quoteError")).max(800, L.t("quoteLongError")),
    consent: z.literal("on", { message: L.t("tConsentError") }),
  });

  if (looksLikeBot(form)) return { status: "sent" };
  if (!(await rateLimit(`share:${await clientKey()}`, 3, 60 * 60_000))) return err(L.t("tTooMany"));
  const parsed = input.safeParse({ ...Object.fromEntries(form.entries()), rating: form.get("rating") ?? "" });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "");
      if (k && !errors[k]) errors[k] = i.message;
    }
    return err(L.t("tErrorGeneric"), errors);
  }
  const d = parsed.data;
  if (looksLikeSpam(`${d.quote} ${d.name} ${d.company ?? ""}`)) return err(L.t("tLinks"), { quote: L.t("tLinks") });

  await db.insert(schema.testimonials).values({
    name: d.name,
    role: d.role || null,
    company: d.company || null,
    email: d.email,
    rating: d.rating,
    quote: d.quote,
    status: "PENDING",
    source: "website",
  });

  const ctx = await emailContext();
  const base = siteUrl();
  // Email and alerts decides who hears about it (set addresses, else staff with alerts on, else the main email).
  const { to, bcc } = await testimonialRecipients(ctx.s);
  await sendMail(ctx.s, { to, bcc, ...testimonialNotice(ctx, d, `${base}/admin/testimonials`) });
  return { status: "sent" };
}
