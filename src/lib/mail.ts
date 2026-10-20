import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { Settings } from "./settings";

let transport: Transporter | null | undefined;

/** SMTP comes from environment variables (secrets). Sender name/address come from Admin → Settings. */
function getTransport() {
  if (transport !== undefined) return transport;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transport = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  transport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
  });
  return transport;
}

export function mailConfigured() {
  return !!process.env.SMTP_HOST;
}

export async function sendMail(
  settings: Settings,
  msg: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string },
): Promise<boolean> {
  const t = getTransport();
  const to = (Array.isArray(msg.to) ? msg.to : [msg.to]).filter(Boolean);
  if (!t || !to.length) {
    console.warn(`[mail] not sent (${!t ? "SMTP not configured" : "no recipient"}): ${msg.subject}`);
    return false;
  }
  const fromAddress = settings.email.fromAddress || process.env.SMTP_FROM || process.env.SMTP_USER || "";
  try {
    await t.sendMail({
      from: { name: settings.email.fromName || settings.company.shortName, address: fromAddress },
      to,
      replyTo: msg.replyTo || settings.email.replyTo || undefined,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    return true;
  } catch (e) {
    console.error("[mail] send failed:", e);
    return false;
  }
}
