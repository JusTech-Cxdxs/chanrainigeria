import "server-only";
import { createHash } from "node:crypto";
import { rateLimit } from "@/lib/guard";
import { siteUrl } from "@/lib/site-url";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { customerAck, teamNotice, type EnquiryForMail } from "./email-templates";
import { emailContext, sendMail } from "./mail";
import { deskFor, getSettings } from "./settings";

export const TYPE_LABELS = {
  GENERAL: "General enquiry",
  QUOTE: "Quote request",
  SERVICE_BOOKING: "Service booking",
  PARTS: "Parts request",
  CALLBACK: "Call-back request",
} as const;
export type EnquiryTypeKey = keyof typeof TYPE_LABELS;

/** Which desk a request goes to when no category decides it. */
const DEFAULT_DESK: Record<EnquiryTypeKey, string> = {
  GENERAL: "sales",
  QUOTE: "sales",
  SERVICE_BOOKING: "service",
  PARTS: "parts",
  CALLBACK: "sales",
};

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const enquiryInput = z.object({
  type: z.enum(["GENERAL", "QUOTE", "SERVICE_BOOKING", "PARTS", "CALLBACK"]),
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^[+\d][\d\s()-]{6,}$/.test(v), "Enter a valid phone number"),
  company: opt(160),
  message: z.string().trim().min(5, "Tell us a little about what you need").max(5000),
  productSlug: opt(160),
  categorySlug: opt(160),
  details: z
    .object({
      machine: opt(160),
      serialNumber: opt(80),
      hourMeter: opt(20),
      siteLocation: opt(300),
      siteState: opt(60),
      urgency: z.enum(["machine_down", "soon", "planned"]).optional(),
      preferredDate: opt(30),
      partNumbers: opt(1000),
      quantity: opt(60),
    })
    .prefault({}),
  consent: z.literal(true, { message: "Please agree so we can use your details to reply" }),
});
export type EnquiryInput = z.input<typeof enquiryInput>;

async function nextRef() {
  const r = await db.execute<{ n: string }>(sql`select nextval('enquiry_ref_seq')::text as n`);
  const n = r.rows[0]?.n ?? String(Date.now() % 1e6);
  const year = new Intl.DateTimeFormat("en", { timeZone: "Africa/Lagos", year: "numeric" }).format(new Date());
  return `CN-${year}-${n.padStart(6, "0")}`;
}

export async function createEnquiry(
  raw: unknown,
  opts: { source: "FORM" | "ENYO"; attachmentIds?: string[]; chatId?: string },
) {
  const parsed = enquiryInput.safeParse(raw);
  if (!parsed.success) return { ok: false as const, errors: z.flattenError(parsed.error).fieldErrors };
  const input = parsed.data;
  const settings = await getSettings();

  // Work out the product and which desk owns this.
  let productId: string | null = null;
  let productName: string | null = null;
  let deskKey = DEFAULT_DESK[input.type];
  let categoryName: string | undefined;

  if (input.productSlug) {
    const p = await db.query.products.findFirst({
      where: eq(schema.products.slug, input.productSlug),
      with: { brand: true, family: { with: { category: true } } },
    });
    if (p) {
      productId = p.id;
      productName = [p.brand?.name, p.name].filter(Boolean).join(" ");
      categoryName = p.family.category.name;
      if (input.type === "QUOTE" || input.type === "GENERAL" || p.family.category.desk === "cng") deskKey = p.family.category.desk;
    }
  }
  if (!productId && input.categorySlug) {
    const c = await db.query.categories.findFirst({ where: eq(schema.categories.slug, input.categorySlug) });
    if (c) {
      categoryName = c.name;
      // Gas enquiries of every kind go to the CNG desk; other lines split by request type.
      if (c.desk === "cng" || input.type === "QUOTE" || input.type === "GENERAL") deskKey = c.desk;
    }
  }
  const desk = deskFor(settings, deskKey);

  const ref = await nextRef();
  const details = { ...input.details, ...(categoryName ? { category: categoryName } : {}) };
  const [row] = await db
    .insert(schema.enquiries)
    .values({
      ref,
      type: input.type,
      source: opts.source,
      desk: desk.key,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      company: input.company ?? null,
      message: input.message,
      details,
      attachmentIds: opts.attachmentIds ?? [],
      productId,
      chatId: opts.chatId ?? null,
    })
    .returning();

  const mail: EnquiryForMail = {
    ref,
    type: input.type,
    typeLabel: TYPE_LABELS[input.type],
    source: opts.source,
    name: input.name,
    email: input.email,
    phone: input.phone,
    company: input.company,
    message: input.message,
    product: productName,
    deskLabel: desk.label,
    deskPhone: desk.phone,
    deskEmail: desk.email,
    details,
    attachments: opts.attachmentIds?.length ?? 0,
  };

  const base = siteUrl();
  const teamTo = desk.email || settings.contact.email;
  const ctx = await emailContext();
  // At most three acknowledgements a day to any one address, so the form can't be used to flood a stranger.
  const recipient = createHash("sha256").update(input.email).digest("base64url").slice(0, 22);
  const ackAllowed = await rateLimit(`ack:${recipient}`, 3, 24 * 3600_000);
  const [customerSent, teamSent] = await Promise.all([
    ackAllowed ? sendMail(settings, { to: input.email, ...customerAck(ctx, mail), replyTo: desk.email || undefined }) : Promise.resolve(false),
    sendMail(settings, { to: teamTo, ...teamNotice(ctx, mail, `${base}/admin/enquiries/${row.id}`), replyTo: input.email }),
  ]);
  if (customerSent || teamSent) {
    await db
      .update(schema.enquiries)
      .set({ customerMailSent: customerSent, teamMailSent: teamSent })
      .where(eq(schema.enquiries.id, row.id));
  }

  return { ok: true as const, ref, id: row.id, desk };
}
