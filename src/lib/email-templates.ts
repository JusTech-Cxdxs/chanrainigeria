// Branded, table-based HTML emails that render in Gmail, Outlook and phone mail apps.
// Letterhead and footer come from the company's settings and manufacturers; nothing is fixed here,
// and nothing about the platform provider appears in any email.
import { siteUrl } from "./site-url";
import type { Settings } from "./settings";

export type EmailBrand = { name: string; logoId: string | null };
export type EmailCtx = { s: Settings; brands: EmailBrand[] };

const esc = (v: string) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");


const FONT = "Arial,Helvetica,sans-serif";
const INK = "#0f172a";
const SOFT = "#475569";
const LEAF = "#22983f";

/** The lockup in table form: leaf, then the first word large with the rest pushed right by a green rule. */
function letterhead(s: Settings) {
  if (s.branding.logoId) {
    return `<img src="${siteUrl()}/media/${s.branding.logoId}" alt="${esc(s.company.shortName)}" height="44" style="height:44px;width:auto;border:0;display:block">`;
  }
  const words = s.company.shortName.trim().split(/\s+/);
  const top = esc(words[0] ?? "");
  const bottom = esc(words.slice(1).join(" ").toUpperCase());
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:10px;vertical-align:middle"><img src="${siteUrl()}/brand/leaf-email.png" width="40" height="48" alt="" style="display:block;border:0;width:40px;height:48px"></td>
<td style="vertical-align:middle">
  <div style="font:800 26px/1 ${FONT};color:${INK};letter-spacing:0.2px">${top}</div>
  ${
    bottom
      ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:5px"><tr>
    <td style="border-bottom:1.5px solid ${LEAF};font-size:0;line-height:0">&nbsp;</td>
    <td style="padding-left:6px;white-space:nowrap;font:600 10px/1 ${FONT};letter-spacing:3.4px;color:${SOFT}">${bottom}</td>
  </tr></table>`
      : ""
  }
</td></tr></table>`;
}

function footer({ s, brands }: EmailCtx) {
  const contact = [
    s.contact.phone && `<a href="tel:${esc(s.contact.phone.replace(/\s/g, ""))}" style="color:${SOFT};text-decoration:none">${esc(s.contact.phone)}</a>`,
    s.contact.email && `<a href="mailto:${esc(s.contact.email)}" style="color:${SOFT};text-decoration:none">${esc(s.contact.email)}</a>`,
  ]
    .filter(Boolean)
    .join("&nbsp;&nbsp;|&nbsp;&nbsp;");
  const brandRow = brands.length
    ? `<tr><td style="padding:18px 28px 6px;border-top:1px solid #e2e8f0">
  <div style="font:600 11px/1.4 ${FONT};color:#64748b;letter-spacing:0.4px;margin-bottom:10px">Equipment we supply</div>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>${brands
    .map((b) =>
      b.logoId
        ? `<td style="padding-right:22px;vertical-align:middle"><img src="${siteUrl()}/media/${b.logoId}" alt="${esc(b.name)}" height="22" style="height:22px;width:auto;border:0;display:block"></td>`
        : `<td style="padding-right:22px;vertical-align:middle;font:800 15px/1 ${FONT};color:#334155;letter-spacing:0.6px">${esc(b.name)}</td>`,
    )
    .join("")}</tr></table>
</td></tr>`
    : "";
  return `${brandRow}
<tr><td style="padding:16px 28px 22px;font:13px/1.6 ${FONT};color:${SOFT}">
  <strong style="color:${INK}">${esc(s.company.name)}</strong><br>
  ${s.contact.address ? `${esc(s.contact.address)}<br>` : ""}
  ${contact ? `${contact}<br>` : ""}
  <span style="color:#64748b">${esc(s.email.footerNote || s.company.groupLine)}</span><br>
  <a href="${siteUrl()}" style="color:${LEAF}">${esc(siteUrl().replace(/^https?:\/\//, ""))}</a>
</td></tr>`;
}

function layout(ctx: EmailCtx, opts: { preheader: string; heading: string; body: string }) {
  const { s } = ctx;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#eef2ef">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ef"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="height:5px;background:${s.branding.primary};font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:24px 28px 18px;border-bottom:1px solid #eef2ef">${letterhead(s)}</td></tr>
<tr><td style="padding:22px 28px 4px;font:700 22px/1.3 ${FONT};color:${INK}">${esc(opts.heading)}</td></tr>
<tr><td style="padding:10px 28px 26px;font:16px/1.6 ${FONT};color:${INK}">${opts.body}</td></tr>
${footer(ctx)}
</table></td></tr></table></body></html>`;
}

function rows(pairs: [string, string | undefined | null][]) {
  const r = pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 14px 7px 0;color:${SOFT};vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:7px 0;font-weight:600">${esc(v!).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:16px 0;font:15px/1.5 ${FONT}">${r}</table>`;
}

function button(ctx: EmailCtx, href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${ctx.s.branding.primary};color:#ffffff;text-decoration:none;font:700 15px/1 ${FONT};padding:14px 22px;border-radius:999px">${esc(label)}</a>`;
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
  category: "Equipment line",
  machine: "Machine",
  serialNumber: "Serial number",
  hourMeter: "Hour meter",
  siteLocation: "Site location",
  siteState: "State",
  urgency: "Urgency",
  preferredDate: "Preferred date",
  partNumbers: "Part numbers",
  quantity: "Quantity",
};
const urgencyLabel: Record<string, string> = { machine_down: "Machine is down", soon: "Within the week", planned: "Planned service" };

function detailPairs(e: EnquiryForMail): [string, string][] {
  return Object.entries(e.details)
    .filter(([k, v]) => v && detailLabels[k])
    .map(([k, v]) => [detailLabels[k], k === "urgency" ? (urgencyLabel[String(v)] ?? String(v)) : String(v)]);
}

/** Acknowledgement to the customer. No staff names appear in customer emails. */
export function customerAck(ctx: EmailCtx, e: EnquiryForMail) {
  // Only fixed wording and values we control go in this email. The visitor's own text stays out,
  // so the form can't be used to send someone else a branded message.
  const contactLine = [
    e.deskPhone && `call <a href="tel:${esc(e.deskPhone.replace(/\s/g, ""))}" style="color:${ctx.s.branding.primary}">${esc(e.deskPhone)}</a>`,
    e.deskEmail && `email <a href="mailto:${esc(e.deskEmail)}" style="color:${ctx.s.branding.primary}">${esc(e.deskEmail)}</a>`,
  ]
    .filter(Boolean)
    .join(" or ");
  const urgent = e.details.urgency === "machine_down";
  const body = `<p style="margin:0 0 12px">Hello,</p>
<p style="margin:0 0 12px">Thank you for contacting ${esc(ctx.s.company.shortName)}. Your ${esc(e.typeLabel.toLowerCase())} has reached our ${esc(e.deskLabel.toLowerCase())} team and someone will get back to you shortly.</p>
${urgent ? `<p style="margin:0 0 12px;padding:12px 14px;background:#fff6e0;border-left:4px solid ${ctx.s.branding.accent};border-radius:6px">You told us the machine is down, so we have marked this as urgent.</p>` : ""}
<p style="margin:0">Your reference is <strong style="font-size:18px;letter-spacing:0.3px">${esc(e.ref)}</strong>. Please quote it if you contact us about this request.</p>
${rows([["Request", e.typeLabel], ["Product", e.product]])}
${contactLine ? `<p style="margin:0">If it's urgent, ${contactLine}.</p>` : ""}`;
  const text = `Hello,

Thank you for contacting ${ctx.s.company.shortName}. Your ${e.typeLabel.toLowerCase()} has reached our ${e.deskLabel.toLowerCase()} team.
Reference: ${e.ref}
${e.product ? `Product: ${e.product}\n` : ""}
${e.deskPhone ? `Phone: ${e.deskPhone}\n` : ""}${e.deskEmail ? `Email: ${e.deskEmail}\n` : ""}
${ctx.s.company.name}
${ctx.s.contact.address}`;
  return {
    subject: `We've received your ${e.typeLabel.toLowerCase()} (${e.ref})`,
    html: layout(ctx, { preheader: `Reference ${e.ref}`, heading: "We've received your request", body }),
    text,
  };
}

/** Notification to the desk that owns the enquiry. */
export function teamNotice(ctx: EmailCtx, e: EnquiryForMail, adminLink: string) {
  const urgent = e.details.urgency === "machine_down";
  const body = `${urgent ? `<p style="margin:0 0 12px;padding:12px 14px;background:#fff6e0;border-left:4px solid ${ctx.s.branding.accent};border-radius:6px;font-weight:700">Machine down. The customer needs an urgent response.</p>` : ""}
<p style="margin:0">New ${esc(e.typeLabel.toLowerCase())} through ${e.source === "ENYO" ? "the Enyo chat" : "the website form"}.</p>
${rows([
  ["Reference", e.ref],
  ["Name", e.name],
  ["Company", e.company],
  ["Email", e.email],
  ["Phone", e.phone],
  ["Product", e.product],
  ...detailPairs(e),
  ["Photos and files", e.attachments ? String(e.attachments) : null],
  ["Message", e.message],
])}
<p style="margin:18px 0 0">${button(ctx, adminLink, "Open in the dashboard")}</p>`;
  const text = `New ${e.typeLabel} (${e.ref}) through ${e.source === "ENYO" ? "Enyo" : "the website form"}
Name: ${e.name}
Company: ${e.company ?? ""}
Email: ${e.email}
Phone: ${e.phone ?? ""}
${e.product ? `Product: ${e.product}\n` : ""}${detailPairs(e)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}

${e.message}

${adminLink}`;
  return {
    subject: `${urgent ? "URGENT: " : ""}${e.typeLabel} from ${e.name}${e.company ? `, ${e.company}` : ""} (${e.ref})`,
    html: layout(ctx, { preheader: `${e.typeLabel} from ${e.name}`, heading: `${e.typeLabel} ${e.ref}`, body }),
    text,
  };
}

/** Reply from staff to the customer, written in the dashboard. */
export function staffReply(ctx: EmailCtx, ref: string, name: string, message: string) {
  const body = `<p style="margin:0 0 12px">Hello ${esc(name.split(/\s+/)[0])},</p>
${message
  .split(/\n{2,}/)
  .map((p) => `<p style="margin:0 0 12px">${esc(p).replace(/\n/g, "<br>")}</p>`)
  .join("")}
<p style="margin:16px 0 0;color:${SOFT};font-size:14px">Reference ${esc(ref)}</p>`;
  return {
    subject: `Re: your request ${ref}`,
    html: layout(ctx, { preheader: message.slice(0, 90), heading: `About your request ${ref}`, body }),
    text: `Hello ${name.split(/\s+/)[0]},\n\n${message}\n\nReference ${ref}\n${ctx.s.company.name}`,
  };
}

/** Staff notice that a visitor left a testimonial to approve. */
export function testimonialNotice(ctx: EmailCtx, t: { name: string; company?: string | null; rating: number; quote: string }, adminLink: string) {
  const body = `<p style="margin:0 0 12px"><strong>${esc(t.name)}</strong>${t.company ? `, ${esc(t.company)}` : ""} left a ${t.rating}-star testimonial on the website.</p>
<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:4px solid ${LEAF};background:#f6f8f7;border-radius:6px">${esc(t.quote)}</blockquote>
<p style="margin:0 0 12px">It won't appear on the site until someone approves it.</p>
<p style="margin:12px 0 0">${button(ctx, adminLink, "Review testimonials")}</p>`;
  return {
    subject: `New testimonial to review from ${t.name}`,
    html: layout(ctx, { preheader: t.quote.slice(0, 90), heading: "A testimonial is waiting for approval", body }),
    text: `${t.name}${t.company ? `, ${t.company}` : ""} left a ${t.rating}-star testimonial.\n\n"${t.quote}"\n\nReview it: ${adminLink}`,
  };
}

/** The daily list of enquiries nobody has answered in time. */
export function overdueDigest(ctx: EmailCtx, deskLabel: string, items: { ref: string; name: string; type: string; hours: number; urgent: boolean; link: string }[], adminLink: string) {
  const list = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 12px 8px 0;font-weight:700;white-space:nowrap"><a href="${i.link}" style="color:${INK}">${esc(i.ref)}</a></td><td style="padding:8px 12px 8px 0">${esc(i.name)}<br><span style="color:${SOFT};font-size:13px">${esc(i.type)}${i.urgent ? " · machine down" : ""}</span></td><td style="padding:8px 0;white-space:nowrap;color:${i.urgent ? "#b45309" : SOFT}">${i.hours} h waiting</td></tr>`,
    )
    .join("");
  const body = `<p style="margin:0 0 12px">These ${items.length === 1 ? "enquiry is" : `${items.length} enquiries are`} still open without a reply past the ${ctx.s.enquiries.overdueHours}-hour target.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:12px 0;font:15px/1.4 ${FONT}">${list}</table>
<p style="margin:16px 0 0">${button(ctx, adminLink, "Open the enquiries")}</p>`;
  return {
    subject: `${items.length} overdue ${items.length === 1 ? "enquiry" : "enquiries"} for ${deskLabel}`,
    html: layout(ctx, { preheader: `${items.length} waiting`, heading: `Waiting for a reply: ${deskLabel}`, body }),
    text: `${items.length} overdue enquiries for ${deskLabel}:\n${items.map((i) => `${i.ref} ${i.name} (${i.type}), ${i.hours} h`).join("\n")}\n\n${adminLink}`,
  };
}
