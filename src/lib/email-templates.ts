// Branded, table-based HTML emails that render in Gmail, Outlook and phone mail apps.
// Every name, colour, logo and contact comes from settings — nothing is fixed here.
import type { Settings } from "./settings";

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function layout(s: Settings, opts: { preheader: string; heading: string; body: string }) {
  const brand = s.branding.primary;
  const logo = s.branding.logoId ? `${siteUrl()}/media/${s.branding.logoId}` : null;
  const header = logo
    ? `<img src="${logo}" alt="${esc(s.company.name)}" height="40" style="height:40px;width:auto;border:0;display:block">`
    : `<span style="font:700 20px/1.2 Arial,Helvetica,sans-serif;color:#1d2a2f">${esc(s.company.shortName)}</span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#eef1ef">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1ef"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden">
<tr><td style="height:4px;background:${brand};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:24px 28px 8px">${header}</td></tr>
<tr><td style="padding:8px 28px 4px;font:700 22px/1.3 Arial,Helvetica,sans-serif;color:#1d2a2f">${esc(opts.heading)}</td></tr>
<tr><td style="padding:8px 28px 24px;font:16px/1.6 Arial,Helvetica,sans-serif;color:#1d2a2f">${opts.body}</td></tr>
<tr><td style="padding:16px 28px;background:#f6f8f7;border-top:1px solid #dfe5e1;font:13px/1.5 Arial,Helvetica,sans-serif;color:#4f5d62">
${esc(s.email.footerNote)}<br><a href="${siteUrl()}" style="color:${brand}">${esc(siteUrl().replace(/^https?:\/\//, ""))}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function rows(pairs: [string, string | undefined | null][]) {
  const r = pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#4f5d62;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v!).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #dfe5e1;border-bottom:1px solid #dfe5e1;margin:16px 0;font:15px/1.5 Arial,Helvetica,sans-serif">${r}</table>`;
}

export type EnquiryForMail = {
  ref: string;
  type: string;
  typeLabel: string;
  source: "FORM" | "ENYO";
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message: string;
  product?: string | null;
  deskLabel: string;
  deskPhone?: string;
  deskEmail?: string;
  details: Record<string, unknown>;
  attachments: number;
};

const detailLabels: Record<string, string> = {
  machine: "Machine",
  serialNumber: "Serial number",
  hourMeter: "Hour meter",
  siteLocation: "Site location",
  siteState: "State",
  urgency: "Urgency",
  preferredDate: "Preferred date",
  partNumbers: "Part numbers",
  quantity: "Quantity",
  category: "Category",
};
const urgencyLabel: Record<string, string> = {
  machine_down: "Machine is down",
  soon: "Within the week",
  planned: "Planned service",
};

function detailPairs(e: EnquiryForMail): [string, string][] {
  return Object.entries(e.details)
    .filter(([k, v]) => v && detailLabels[k])
    .map(([k, v]) => [detailLabels[k], k === "urgency" ? urgencyLabel[String(v)] ?? String(v) : String(v)]);
}

/** Acknowledgement to the customer. No staff names appear in customer emails. */
export function customerAck(s: Settings, e: EnquiryForMail) {
  const first = e.name.split(/\s+/)[0];
  const contactLine = [e.deskPhone && `call ${esc(e.deskPhone)}`, e.deskEmail && `email <a href="mailto:${esc(e.deskEmail)}" style="color:${s.branding.primary}">${esc(e.deskEmail)}</a>`]
    .filter(Boolean)
    .join(" or ");
  const urgent = e.details.urgency === "machine_down";
  const body = `<p style="margin:0 0 12px">Hello ${esc(first)},</p>
<p style="margin:0 0 12px">Thank you for contacting ${esc(s.company.shortName)}. Your ${esc(e.typeLabel.toLowerCase())} has reached our ${esc(e.deskLabel.toLowerCase())} desk and someone will get back to you shortly.</p>
${urgent ? `<p style="margin:0 0 12px;padding:10px 12px;background:#fff6e0;border-left:3px solid ${s.branding.accent}">You told us the machine is down, so this has been marked urgent.</p>` : ""}
<p style="margin:0">Your reference is <strong style="font-size:18px">${esc(e.ref)}</strong>. Please quote it if you contact us about this.</p>
${rows([["Request", e.typeLabel], ["Product", e.product], ...detailPairs(e), ["Your message", e.message]])}
${contactLine ? `<p style="margin:0">If it's urgent, ${contactLine}.</p>` : ""}`;
  const text = `Hello ${first},

Thank you for contacting ${s.company.shortName}. Your ${e.typeLabel.toLowerCase()} has reached our ${e.deskLabel.toLowerCase()} desk.
Reference: ${e.ref}
${e.product ? `Product: ${e.product}\n` : ""}${detailPairs(e).map(([k, v]) => `${k}: ${v}`).join("\n")}

Your message:
${e.message}

${e.deskPhone ? `Phone: ${e.deskPhone}\n` : ""}${e.deskEmail ? `Email: ${e.deskEmail}\n` : ""}
${s.email.footerNote}`;
  return {
    subject: `We've received your ${e.typeLabel.toLowerCase()} — ${e.ref}`,
    html: layout(s, { preheader: `Reference ${e.ref}`, heading: "We've received your request", body }),
    text,
  };
}

/** Notification to the desk that owns the enquiry. */
export function teamNotice(s: Settings, e: EnquiryForMail, adminLink: string) {
  const urgent = e.details.urgency === "machine_down";
  const body = `${urgent ? `<p style="margin:0 0 12px;padding:10px 12px;background:#fff6e0;border-left:3px solid ${s.branding.accent};font-weight:700">Machine down — customer needs an urgent response.</p>` : ""}
<p style="margin:0">New ${esc(e.typeLabel.toLowerCase())} via ${e.source === "ENYO" ? "Enyo chat" : "the website form"}.</p>
${rows([
  ["Reference", e.ref],
  ["Name", e.name],
  ["Company", e.company],
  ["Email", e.email],
  ["Phone", e.phone],
  ["Product", e.product],
  ...detailPairs(e),
  ["Photos/files", e.attachments ? String(e.attachments) : null],
  ["Message", e.message],
])}
<p style="margin:16px 0 0"><a href="${adminLink}" style="display:inline-block;background:${s.branding.primary};color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:6px">Open in dashboard</a></p>`;
  const text = `New ${e.typeLabel} (${e.ref}) via ${e.source === "ENYO" ? "Enyo" : "web form"}
Name: ${e.name}
Company: ${e.company ?? ""}
Email: ${e.email}
Phone: ${e.phone ?? ""}
${e.product ? `Product: ${e.product}\n` : ""}${detailPairs(e).map(([k, v]) => `${k}: ${v}`).join("\n")}

${e.message}

${adminLink}`;
  return {
    subject: `${urgent ? "URGENT · " : ""}${e.typeLabel}: ${e.name}${e.company ? `, ${e.company}` : ""} — ${e.ref}`,
    html: layout(s, { preheader: `${e.typeLabel} from ${e.name}`, heading: `${e.typeLabel} — ${e.ref}`, body }),
    text,
  };
}

/** Reply from staff to the customer, written in the dashboard. */
export function staffReply(s: Settings, ref: string, name: string, message: string) {
  const body = `<p style="margin:0 0 12px">Hello ${esc(name.split(/\s+/)[0])},</p>
${message
  .split(/\n{2,}/)
  .map((p) => `<p style="margin:0 0 12px">${esc(p).replace(/\n/g, "<br>")}</p>`)
  .join("")}
<p style="margin:16px 0 0;color:#4f5d62;font-size:14px">Reference ${esc(ref)}</p>`;
  return {
    subject: `Re: your request ${ref}`,
    html: layout(s, { preheader: message.slice(0, 90), heading: `About your request ${ref}`, body }),
    text: `Hello ${name.split(/\s+/)[0]},\n\n${message}\n\nReference ${ref}\n${s.email.footerNote}`,
  };
}
