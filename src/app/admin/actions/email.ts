"use server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit, requireAdmin } from "@/lib/auth";
import { testMessage } from "@/lib/email-templates";
import { rateLimit } from "@/lib/guard";
import { snapshot } from "@/lib/history";
import { deliver, emailContext, mailSource, parseAddresses } from "@/lib/mail";
import { seal } from "@/lib/secret-box";
import { getSettings, settingsSchema, type Settings } from "@/lib/settings";

const str = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);
const isEmail = (v: string) => /^[^@\s<>"']+@[^@\s<>"']+\.[a-z]{2,}$/i.test(v);

/** Every word of a list that isn't an email address, so the person can see what to fix. */
function badAddresses(v: string) {
  return v
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter((x) => x && !isEmail(x));
}

export async function saveEmailSettings(f: FormData) {
  const user = await requireAdmin("email");
  const cur = await getSettings();
  const fail = (msg: string): never => redirect(`/admin/email?error=${encodeURIComponent(msg)}`);

  const fromAddress = str(f, "fromAddress", 200).toLowerCase();
  const replyTo = str(f, "replyTo", 200).toLowerCase();
  if (fromAddress && !isEmail(fromAddress)) fail("The sender address isn't a valid email address.");
  if (replyTo && !isEmail(replyTo)) fail("The reply-to address isn't a valid email address.");

  const host = str(f, "smtpHost", 200).toLowerCase();
  if (host && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(host)) fail("The mail server name should look like smtp.example.com, without http:// or spaces.");
  const port = Number(str(f, "smtpPort", 6) || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail("The port should be a number such as 587 or 465.");
  const secure = str(f, "smtpSecurity", 20) === "ssl";

  // The password is never sent to the browser. Empty keeps the saved one.
  const newPass = String(f.get("smtpPass") ?? "");
  let passEnc = cur.email.smtp.passEnc;
  if (f.get("smtpClearPass") === "on") passEnc = "";
  else if (newPass) passEnc = seal(newPass.slice(0, 500));

  const also = str(f, "alsoEmail", 2000);
  const testimonialsTo = str(f, "testimonialsTo", 2000);
  for (const [label, v] of [
    ["Extra addresses for every enquiry", also],
    ["Testimonials go to", testimonialsTo],
  ] as const) {
    const bad = badAddresses(v);
    if (bad.length) fail(`${label}: "${bad.slice(0, 3).join('", "')}" ${bad.length === 1 ? "isn't an email address" : "aren't email addresses"}.`);
  }

  const email: Settings["email"] = {
    fromName: str(f, "fromName", 120),
    fromAddress,
    replyTo,
    footerNote: str(f, "footerNote", 240),
    brandsLabel: str(f, "brandsLabel", 60) || "Authorised dealer for",
    smtp: { host, port, secure, user: str(f, "smtpUser", 200), passEnc },
  };
  const alerts: Settings["alerts"] = {
    deskInbox: f.get("deskInbox") === "on",
    alsoEmail: parseAddresses(also).join(", "),
    testimonialsTo: parseAddresses(testimonialsTo).join(", "),
    overdueDigest: f.get("overdueDigest") === "on",
  };

  const next: Settings = { ...cur, email, alerts };
  const parsed = settingsSchema.safeParse(next);
  if (!parsed.success) fail(parsed.error.issues.map((i) => `${i.path.join(" ")}: ${i.message}`).join("; "));

  await snapshot("settings", "1", "Company settings", "update", user.id);
  await db
    .insert(schema.siteSettings)
    .values({ id: 1, data: next })
    .onConflictDoUpdate({ target: schema.siteSettings.id, set: { data: next } });

  // The audit line says what changed, never the password itself.
  const changed: string[] = [];
  const was = cur.email;
  if (was.fromName !== email.fromName || was.fromAddress !== email.fromAddress || was.replyTo !== email.replyTo) changed.push("sender");
  if (was.smtp.host !== email.smtp.host || was.smtp.port !== email.smtp.port || was.smtp.secure !== email.smtp.secure || was.smtp.user !== email.smtp.user) changed.push("mail server");
  if (was.smtp.passEnc !== email.smtp.passEnc) changed.push(email.smtp.passEnc ? "mail server password" : "removed mail server password");
  if (JSON.stringify(cur.alerts) !== JSON.stringify(alerts)) changed.push("alert routing");
  if (was.footerNote !== email.footerNote || was.brandsLabel !== email.brandsLabel) changed.push("email look");
  await audit(user.id, "update", "settings", changed.length ? `Changed email settings: ${changed.join(", ")}` : "Saved email settings (no changes)");

  revalidateTag("settings");
  redirect("/admin/email?saved=Email%20settings%20saved.");
}

export type TestState = { status: "idle" } | { status: "sent"; to: string; at: number } | { status: "error"; message: string; at: number };

/** Sends a test email to the signed-in person, using the saved settings. */
export async function sendTestEmail(): Promise<TestState> {
  const user = await requireAdmin("email");
  if (!(await rateLimit(`mailtest:${user.id}`, 6, 10 * 60_000))) {
    return { status: "error", message: "That's several tests in a few minutes. Please wait a little and try again.", at: Date.now() };
  }
  const ctx = await emailContext();
  const source = mailSource(ctx.s);
  const sourceLabel =
    source === "dashboard" ? `${ctx.s.email.smtp.host}:${ctx.s.email.smtp.port} (set in the dashboard)` : source === "environment" ? "the server's own settings" : "none";
  const r = await deliver(ctx.s, { to: user.email, ...testMessage(ctx, { name: user.name, source: sourceLabel }) });
  await audit(user.id, "test", "email", r.ok ? `Sent a test email to ${user.email}` : `Test email failed: ${r.error.slice(0, 160)}`);
  return r.ok ? { status: "sent", to: user.email, at: Date.now() } : { status: "error", message: r.error, at: Date.now() };
}
