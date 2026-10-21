"use server";
import { siteUrl } from "@/lib/site-url";
import { z } from "zod";
import { db, schema } from "@/db";
import { clientKey, looksLikeBot, looksLikeSpam, rateLimit } from "@/lib/guard";
import { testimonialNotice } from "@/lib/email-templates";
import { emailContext, sendMail } from "@/lib/mail";

export type ShareState = { status: "idle" } | { status: "error"; message: string; values: Record<string, string>; at: number } | { status: "sent" };

const input = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  role: z.string().trim().max(80).optional(),
  company: z.string().trim().max(120).optional(),
  email: z.string().trim().toLowerCase().email("Enter a valid email so we can confirm it's you").max(200),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().trim().min(20, "Write at least a sentence or two").max(800, "Keep it under 800 characters"),
  consent: z.literal("on", { message: "Tick the box so we may publish your name with your words" }),
});

/** Visitor testimonials always wait for staff approval, so nothing appears on the site unchecked. */
export async function shareTestimonial(_: ShareState, form: FormData): Promise<ShareState> {
  const values: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && k !== "_t" && !k.startsWith("$")) values[k] = v;
  const err = (message: string): ShareState => ({ status: "error", message, values, at: Date.now() });

  if (looksLikeBot(form)) return { status: "sent" };
  if (!(await rateLimit(`share:${await clientKey()}`, 3, 60 * 60_000))) return err("You've already sent a few. Please try again later.");
  const parsed = input.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Please check the form.");
  const d = parsed.data;
  if (looksLikeSpam(`${d.quote} ${d.name} ${d.company ?? ""}`)) return err("Please remove links or code from your message.");

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
  await sendMail(ctx.s, { to: ctx.s.contact.email, ...testimonialNotice(ctx, d, `${base}/admin/testimonials`) });
  return { status: "sent" };
}

