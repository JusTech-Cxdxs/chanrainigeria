import "server-only";
import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import nodemailer, { type Transporter } from "nodemailer";
import { db, schema } from "@/db";
import { type Permission, SYSTEM_ROLES } from "./permissions";
import { open } from "./secret-box";
import { deskFor, type Settings } from "./settings";

// ---------- Which mail server ----------
// The company sets its mail server under Email and alerts in the dashboard. Until it does, the
// SMTP_* environment variables are used (set by whoever hosts the site). With neither, nothing is
// sent and enquiries are only saved in the dashboard.

export type MailSource = "dashboard" | "environment" | "none";

type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string };

export function mailSource(s?: Settings | null): MailSource {
  if (s?.email.smtp.host.trim()) return "dashboard";
  if (process.env.SMTP_HOST) return "environment";
  return "none";
}

/**
 * True when emails can go out. Pass the settings so a mail server set in the dashboard counts;
 * without them only the server environment is checked.
 */
export function mailConfigured(s?: Settings | null) {
  return mailSource(s) !== "none";
}

function resolveSmtp(s: Settings): { ok: true; config: SmtpConfig } | { ok: false; error: string } {
  const source = mailSource(s);
  if (source === "dashboard") {
    const m = s.email.smtp;
    const pass = open(m.passEnc);
    if (pass === null) return { ok: false, error: "The saved mail server password can't be read (the server's AUTH_SECRET has changed). Type the password again under Email and alerts." };
    return { ok: true, config: { host: m.host.trim(), port: m.port, secure: m.secure, user: m.user.trim(), pass } };
  }
  if (source === "environment") {
    const port = Number(process.env.SMTP_PORT ?? 587);
    return {
      ok: true,
      config: {
        host: process.env.SMTP_HOST!,
        port,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
      },
    };
  }
  return { ok: false, error: "No mail server is set up. Add one under Email and alerts." };
}

/** One transport per distinct server set-up, so changing the settings takes effect at once. */
const transports = new Map<string, Transporter>();

function transportFor(c: SmtpConfig) {
  const id = createHash("sha256").update(JSON.stringify(c)).digest("base64url");
  let t = transports.get(id);
  if (!t) {
    if (transports.size >= 4) {
      for (const old of transports.values()) old.close();
      transports.clear();
    }
    t = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.secure,
      auth: c.user ? { user: c.user, pass: c.pass } : undefined,
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
    transports.set(id, t);
  }
  return t;
}

function fromAddress(s: Settings) {
  if (s.email.fromAddress) return s.email.fromAddress;
  if (mailSource(s) === "dashboard" && /@/.test(s.email.smtp.user)) return s.email.smtp.user.trim();
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}

export type MailMessage = { to: string | string[]; bcc?: string[]; subject: string; html: string; text: string; replyTo?: string };

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => x.trim()).filter(Boolean);

/** Sends one message and reports what happened, including the mail server's own error text. */
export async function deliver(s: Settings, msg: MailMessage): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = list(msg.to);
  const bcc = list(msg.bcc).filter((b) => !to.includes(b));
  if (!to.length) return { ok: false, error: "There is no one to send this to." };
  const r = resolveSmtp(s);
  if (!r.ok) return r;
  const from = fromAddress(s);
  if (!from) return { ok: false, error: "There is no sender address. Fill in the sender address under Email and alerts." };
  try {
    await transportFor(r.config).sendMail({
      from: { name: s.email.fromName || s.company.shortName, address: from },
      to,
      bcc: bcc.length ? bcc : undefined,
      replyTo: msg.replyTo || s.email.replyTo || undefined,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    return { ok: true };
  } catch (e) {
    const err = e as { message?: string; response?: string; code?: string };
    return { ok: false, error: (err.response || err.message || String(e)).slice(0, 500) };
  }
}

/** Fire-and-report: logs a failure and returns false, so a mail problem never breaks a form. */
export async function sendMail(s: Settings, msg: MailMessage): Promise<boolean> {
  const r = await deliver(s, msg);
  if (!r.ok) console.warn(`[mail] not sent (${r.error}): ${msg.subject}`);
  return r.ok;
}

/**
 * Settings and manufacturers for the email letterhead and the "Authorised dealer for" strip.
 * Gmail and Outlook don't show SVG images, so an SVG logo is replaced by the lockup or the brand
 * name in text.
 */
export async function emailContext() {
  const [{ getSettings }, { getBrands }, { siteUrl }] = await Promise.all([import("./settings"), import("./catalogue"), import("./site-url")]);
  const [s, all] = await Promise.all([getSettings(), getBrands()]);
  const brands = all.filter((b) => b.showInEmail);
  const ids = [s.branding.logoId, ...brands.map((b) => b.logoId)].filter((x): x is string => !!x);
  const usable = new Set<string>();
  if (ids.length) {
    const rows = await db
      .select({ id: schema.media.id, mime: schema.media.mimeType, deletedAt: schema.media.deletedAt })
      .from(schema.media)
      .where(inArray(schema.media.id, ids))
      .catch(() => []);
    for (const r of rows) if (!r.deletedAt && /^image\/(png|jpe?g|gif|webp)$/.test(r.mime)) usable.add(r.id);
  }
  const ok = (id: string | null) => (id && usable.has(id) ? id : null);
  return {
    s,
    logoUrl: ok(s.branding.logoId) ? `${siteUrl()}/media/${s.branding.logoId}` : null,
    brands: brands.map((b) => ({ name: b.name, logoId: ok(b.logoId), relationship: b.relationship ?? "" })),
  };
}

// ---------- Who receives which email ----------

/** Comma, semicolon or line separated addresses, checked and de-duplicated. */
export function parseAddresses(v: string) {
  const out: string[] = [];
  for (const raw of v.split(/[,;\s]+/)) {
    const a = raw.trim().toLowerCase();
    if (/^[^@\s<>"']+@[^@\s<>"']+\.[a-z]{2,}$/i.test(a) && !out.includes(a)) out.push(a);
  }
  return out;
}

const LEGACY: Record<string, string[]> = Object.fromEntries(SYSTEM_ROLES.filter((r) => r.legacy).map((r) => [r.legacy, r.permissions]));

export type OptedIn = { id: string; name: string; email: string; desks: string[]; perms: string[]; isMaster: boolean };

/** Active staff who turned on email alerts on the Team page, with what their role allows. */
export async function optedInStaff(): Promise<OptedIn[]> {
  const rows = await db.query.adminUsers.findMany({
    where: and(eq(schema.adminUsers.active, true), eq(schema.adminUsers.notify, true)),
    columns: { id: true, name: true, email: true, role: true, notifyDesks: true },
    with: { roleRef: { columns: { permissions: true } } },
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email.toLowerCase(),
    desks: u.notifyDesks ?? [],
    isMaster: u.role === "MASTER",
    perms: u.role === "MASTER" ? ["*"] : u.roleRef ? u.roleRef.permissions : (LEGACY[u.role] ?? []),
  }));
}

const can = (u: OptedIn, p: Permission) => u.perms.includes("*") || u.perms.includes(p);

function split(addresses: string[]) {
  const unique = [...new Set(addresses.map((a) => a.toLowerCase()))];
  return { to: unique.slice(0, 1), bcc: unique.slice(1), all: unique };
}

/**
 * A new enquiry (and the daily overdue list) for one desk goes to: the desk inbox when that is
 * switched on, the extra addresses, and staff with alerts on for that desk whose role includes
 * Enquiries. One message: To the first address, Bcc the rest. If that leaves nobody, the company's
 * main email gets it, so no enquiry goes unseen.
 */
export async function enquiryRecipients(s: Settings, deskKey: string, staff?: OptedIn[]) {
  const desk = deskFor(s, deskKey);
  const people = (staff ?? (await optedInStaff().catch(() => [] as OptedIn[]))).filter((u) => can(u, "enquiries") && (!u.desks.length || u.desks.includes(desk.key)));
  const addresses = [...(s.alerts.deskInbox && desk.email ? [desk.email] : []), ...parseAddresses(s.alerts.alsoEmail), ...people.map((u) => u.email)];
  const r = split(addresses.length ? addresses : parseAddresses(s.contact.email));
  return { ...r, desk };
}

/** Testimonials waiting: the addresses set for them, else staff with alerts on who can approve them, else the main email. */
export async function testimonialRecipients(s: Settings, staff?: OptedIn[]) {
  const set = parseAddresses(s.alerts.testimonialsTo);
  if (set.length) return split(set);
  const people = (staff ?? (await optedInStaff().catch(() => [] as OptedIn[]))).filter((u) => can(u, "testimonials")).map((u) => u.email);
  return split(people.length ? people : parseAddresses(s.contact.email));
}
