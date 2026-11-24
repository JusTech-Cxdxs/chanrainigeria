// Branded HTML emails that hold up in Gmail, Outlook (including Outlook on Windows), Apple Mail and
// phone apps: nested tables, inline styles, a 600px column, a VML button for Outlook, and dark-mode
// rules in their own <style> blocks. Letterhead, colours, footer and the "Authorised dealer for" strip
// all come from the company's settings and brands. Nothing about the platform provider appears here.
//
// Bodies are built with the `html` tag below, which escapes every value unless it was made by a
// helper in this file, so visitor-typed text can't turn into markup.
import { siteUrl } from "./site-url";
import type { Settings } from "./settings";

/** logoUrl is absolute (emails need full addresses); null shows the brand name instead. */
export type EmailBrand = { name: string; logoUrl: string | null; relationship?: string; aspect?: number };
/** logoUrl: the company logo for the letterhead (null = the lockup); left out, it is worked out from the settings. */
export type EmailCtx = { s: Settings; brands: EmailBrand[]; logoUrl?: string | null };

// ---------- Safe HTML ----------

class SafeHtml {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}
type HtmlValue = SafeHtml | string | number | null | undefined | false | HtmlValue[];

const raw = (v: string) => new SafeHtml(v);
export const esc = (v: string) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function toHtml(v: HtmlValue): string {
  if (v === null || v === undefined || v === false) return "";
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(toHtml).join("");
  return esc(String(v));
}

function html(strings: TemplateStringsArray, ...values: HtmlValue[]) {
  let out = strings[0] ?? "";
  values.forEach((v, i) => (out += toHtml(v) + (strings[i + 1] ?? "")));
  return new SafeHtml(out);
}

/** Only http(s), mailto and tel links are allowed into an href. */
const href = (u: string) => (/^(https?:|mailto:|tel:)/i.test(u) ? u : "#");

// ---------- Design tokens ----------

const FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif";
const C = {
  page: "#f1f5f3",
  card: "#ffffff",
  surface: "#f7faf8",
  border: "#e3e9e6",
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  leaf: "#22983f",
};
type Tone = "success" | "warning" | "neutral";
const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  success: { bg: "#dcfce7", fg: "#166534", dot: "#16a34a" },
  warning: { bg: "#fef3c7", fg: "#92400e", dot: "#d97706" },
  neutral: { bg: "#eef2f0", fg: "#334155", dot: "#64748b" },
};

const P = `margin:0 0 16px 0;font-family:${FONT};font-size:15px;line-height:1.65;color:${C.body};`;

function para(content: HtmlValue, small = false) {
  return small
    ? html`<p class="em-muted" style="${raw(`margin:0 0 14px 0;font-family:${FONT};font-size:13px;line-height:1.55;color:${C.muted};`)}">${content}</p>`
    : html`<p class="em-body" style="${raw(P)}">${content}</p>`;
}
const strong = (v: HtmlValue) => html`<strong class="em-strong" style="color:${raw(C.ink)};font-weight:700;">${v}</strong>`;
const link = (label: HtmlValue, url: string, color: string) => html`<a href="${href(url)}" class="em-link" style="color:${raw(color)};text-decoration:underline;">${label}</a>`;

type Row = [string, HtmlValue] | null | undefined | false;

/** Label and value rows in a quiet bordered box. Empty values are left out. */
function details(rows: Row[]) {
  const kept = rows.filter((r): r is [string, HtmlValue] => !!r && toHtml(r[1]).trim() !== "");
  if (!kept.length) return raw("");
  const line = (i: number) => raw(i ? `border-top:1px solid ${C.border};` : "");
  return html`<table role="presentation" class="em-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;border:1px solid ${raw(C.border)};border-radius:10px;background-color:${raw(C.surface)};border-collapse:separate;">${kept.map(
    ([k, v], i) => html`<tr>
<td class="em-muted em-line" valign="top" width="34%" style="padding:11px 12px 11px 16px;font-family:${raw(FONT)};font-size:13px;line-height:1.45;color:${raw(C.muted)};${line(i)}">${k}</td>
<td class="em-strong em-line" valign="top" style="padding:11px 16px 11px 0;font-family:${raw(FONT)};font-size:14px;line-height:1.5;font-weight:600;color:${raw(C.ink)};word-break:break-word;${line(i)}">${v}</td>
</tr>`,
  )}</table>`;
}

/** A tinted note with a coloured edge, for what the reader must notice. */
function callout(content: HtmlValue, tone: Tone) {
  const t = TONES[tone];
  return html`<table role="presentation" class="em-callout em-callout-${raw(tone)}" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;background-color:${raw(t.bg)};border-left:4px solid ${raw(t.dot)};border-radius:8px;">
<tr><td class="em-callout-text" style="padding:13px 16px;font-family:${raw(FONT)};font-size:14px;line-height:1.55;color:${raw(t.fg)};">${content}</td></tr></table>`;
}

/** A big reference number in a tinted box. */
function highlight(caption: string, value: string, sub: HtmlValue) {
  const t = TONES.success;
  return html`<table role="presentation" class="em-callout em-callout-success" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;background-color:${raw(t.bg)};border-radius:10px;">
<tr><td class="em-callout-text" style="padding:16px 20px;font-family:${raw(FONT)};color:${raw(t.fg)};">
<p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${caption}</p>
<p style="margin:0;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:0.02em;">${value}</p>
${sub ? html`<p style="margin:6px 0 0 0;font-size:13px;line-height:1.5;">${sub}</p>` : ""}
</td></tr></table>`;
}

/** A button that survives Outlook on Windows (VML) and every other client (a padded link). */
function button(s: Settings, label: string, url: string) {
  const bg = s.branding.primary;
  const width = Math.min(520, Math.max(200, Math.round(label.length * 8.6 + 72)));
  const vml = `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(href(url))}" style="height:46px;v-text-anchor:middle;width:${width}px;" arcsize="18%" stroke="f" fillcolor="${bg}"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${esc(label)}</center></v:roundrect><![endif]-->`;
  return html`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px 0;"><tr>
<td align="left" bgcolor="${raw(bg)}" style="border-radius:8px;background-color:${raw(bg)};">${raw(vml)}${raw("<!--[if !mso]><!-->")}<a href="${href(url)}" class="em-btn" style="display:inline-block;padding:13px 24px;border-radius:8px;background-color:${raw(bg)};font-family:${raw(FONT)};font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">${label}&nbsp;&nbsp;&rarr;</a>${raw("<!--<![endif]-->")}</td>
</tr></table>`;
}

// ---------- Letterhead ----------

/** The company's uploaded logo, or the Chanrai lockup: leaf, first word large, the rest beneath in regular letters. */
function letterhead(s: Settings, logoUrl: string | null) {
  if (logoUrl) {
    return html`<img src="${logoUrl}" alt="${s.company.shortName}" height="44" style="display:block;height:44px;width:auto;max-width:240px;border:0;outline:none;text-decoration:none;font-family:${raw(FONT)};font-size:18px;font-weight:800;color:${raw(C.ink)};">`;
  }
  const words = s.company.shortName.trim().split(/\s+/);
  const top = words[0] ?? s.company.shortName;
  const bottom = words.slice(1).join(" ");
  return html`<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle" style="padding:0 10px 0 0;"><img src="${siteUrl()}/brand/leaf-email.png" width="38" height="46" alt="" style="display:block;width:38px;height:46px;border:0;outline:none;"></td>
<td valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td colspan="2" class="em-strong" style="font-family:${raw(FONT)};font-size:26px;line-height:26px;font-weight:800;letter-spacing:0.01em;color:${raw(C.ink)};white-space:nowrap;mso-line-height-rule:exactly;">${top}</td></tr>
${
  bottom
    ? html`<tr><td colspan="2" class="em-muted" style="padding:4px 0 0 0;font-family:${raw(FONT)};font-size:14px;line-height:15px;font-weight:400;color:${raw(C.muted)};white-space:nowrap;mso-line-height-rule:exactly;">${bottom}</td></tr>`
    : ""
}
</table></td></tr></table>`;
}

// ---------- Footer: "Authorised dealer for" strip, then the company ----------

function brandStrip({ s, brands }: EmailCtx) {
  if (!brands.length) return raw("");
  // One row on every screen. Each logo fills its own box edge to edge; boxes are as wide as the logo's
  // shape needs, so all of them end up the same height.
  const list = brands.slice(0, 4);
  const total = 480;
  const gap = 8;
  const shapes = list.map((b) => (b.logoUrl ? (b.aspect ?? 3) : 3));
  const sum = shapes.reduce((a, b) => a + b, 0);
  const widths = shapes.map((a) => Math.floor(((total - gap * (list.length - 1)) * a) / sum));
  const height = Math.round(widths[0] / shapes[0]);
  const cells = list.map((b, i) => {
    const w = widths[i];
    const pct = Math.round((w / total) * 1000) / 10;
    const pad = i < list.length - 1 ? `padding:0 ${gap}px 0 0;` : "padding:0;";
    return html`<td class="em-brand" valign="top" width="${w}" style="width:${pct}%;${raw(pad)}">
${
  b.logoUrl
    ? html`<img src="${b.logoUrl}" alt="${b.name}" width="${w}" style="display:block;width:100%;max-width:${w}px;height:auto;background-color:#ffffff;border:0;border-radius:3px;outline:none;font-family:${raw(FONT)};font-size:13px;font-weight:800;color:${raw(C.ink)};">`
    : html`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" height="${height}" style="height:${height}px;background-color:#ffffff;border-radius:3px;font-family:${raw(FONT)};font-size:13px;font-weight:800;letter-spacing:0.06em;color:#1e293b;white-space:nowrap;">${b.name.toUpperCase()}</td></tr></table>`
}
</td>`;
  });
  return html`<tr><td class="em-strip em-px" align="center" style="padding:22px 28px 14px 28px;background-color:${raw(C.surface)};border-top:1px solid ${raw(C.border)};">
<p class="em-muted" style="margin:0 0 14px 0;font-family:${raw(FONT)};font-size:10.5px;line-height:1.4;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${raw(C.muted)};">${s.email.brandsLabel || "Authorised dealer for"}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${total}px;"><tr>${cells}</tr></table>
</td></tr>`;
}

function companyFooter(s: Settings, reason: string) {
  const site = siteUrl();
  const contacts: HtmlValue[] = [];
  if (s.contact.phone) contacts.push(link(s.contact.phone, `tel:${s.contact.phone.replace(/[^\d+]/g, "")}`, C.muted));
  if (s.contact.email) contacts.push(link(s.contact.email, `mailto:${s.contact.email}`, C.muted));
  const note = s.email.footerNote || s.company.groupLine;
  return html`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td class="em-px" align="center" style="padding:22px 32px 0 32px;font-family:${raw(FONT)};font-size:12px;line-height:1.65;color:${raw(C.muted)};">
<p class="em-body" style="margin:0 0 2px 0;font-size:13px;font-weight:700;color:${raw(C.body)};">${s.company.name}</p>
${s.contact.address ? html`<p class="em-muted" style="margin:0;color:${raw(C.muted)};">${s.contact.address}</p>` : ""}
${contacts.length ? html`<p class="em-muted" style="margin:0;color:${raw(C.muted)};">${contacts.flatMap((c, i) => (i ? [raw(" &nbsp;&middot;&nbsp; "), c] : [c]))}</p>` : ""}
${note ? html`<p class="em-muted" style="margin:10px 0 0 0;color:${raw(C.muted)};">${note}</p>` : ""}
<p style="margin:4px 0 0 0;"><a href="${site}" class="em-link" style="color:${raw(s.branding.primary)};text-decoration:none;font-weight:600;">${site.replace(/^https?:\/\//, "")}</a></p>
<p class="em-muted" style="margin:12px 0 0 0;font-size:11px;color:${raw(C.faint)};">${reason}</p>
</td></tr></table>`;
}

// ---------- Layout ----------

const STYLE_BASE = `
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic}
body{margin:0!important;padding:0!important;width:100%!important}
a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
@media only screen and (max-width:620px){
.em-outer{padding:12px 8px 28px 8px!important}
.em-px{padding-left:22px!important;padding-right:22px!important}
.em-h1{font-size:21px!important;line-height:28px!important}
.em-stack{display:block!important;width:100%!important;text-align:left!important}
.em-ctx{padding:12px 0 0 0!important;text-align:left!important}
}`;

const STYLE_DARK = `
:root{color-scheme:light dark;supported-color-schemes:light dark}
@media (prefers-color-scheme:dark){
.em-page,.em-outer{background-color:#0c1511!important}
.em-card,.em-head{background-color:#121e18!important;border-color:#24352c!important}
.em-box,.em-strip{background-color:#0f1914!important;border-color:#24352c!important}
.em-line{border-color:#24352c!important}
.em-strong,.em-h1{color:#f1f5f3!important}
.em-body{color:#cfd8d3!important}
.em-muted{color:#94a39b!important}
.em-link{color:#4ade80!important}
.em-callout-success{background-color:#0f2e1d!important}
.em-callout-warning{background-color:#33240a!important}
.em-callout-neutral{background-color:#17221c!important}
.em-callout-success .em-callout-text{color:#bbf7d0!important}
.em-callout-warning .em-callout-text{color:#fde68a!important}
.em-callout-neutral .em-callout-text{color:#cfd8d3!important}
.em-chip-success{background-color:#0f2e1d!important;color:#86efac!important}
.em-chip-warning{background-color:#33240a!important;color:#fcd34d!important}
.em-chip-neutral{background-color:#17221c!important;color:#cfd8d3!important}
}`;

// Outlook.com marks dark mode with data-ogsc / data-ogsb; kept apart because some clients drop a whole block over them.
const STYLE_OUTLOOK_DARK = `
[data-ogsb] .em-page,[data-ogsb] .em-outer{background-color:#0c1511!important}
[data-ogsb] .em-card,[data-ogsb] .em-head{background-color:#121e18!important}
[data-ogsb] .em-box,[data-ogsb] .em-strip{background-color:#0f1914!important}
[data-ogsc] .em-strong,[data-ogsc] .em-h1{color:#f1f5f3!important}
[data-ogsc] .em-body{color:#cfd8d3!important}
[data-ogsc] .em-muted{color:#94a39b!important}`;

type LayoutOpts = {
  preheader: string;
  heading: string;
  body: SafeHtml;
  /** Small coloured label above the heading */
  status?: { label: string; tone: Tone };
  /** Shown at the right of the letterhead, e.g. the desk */
  context?: string;
  audience: "customer" | "staff";
  reason?: string;
};

function layout(ctx: EmailCtx, o: LayoutOpts) {
  const { s } = ctx;
  const logoUrl = ctx.logoUrl !== undefined ? ctx.logoUrl : s.branding.logoId ? `${siteUrl()}/media/${s.branding.logoId}` : null;
  const reason =
    o.reason ??
    (o.audience === "customer"
      ? `You are receiving this because you contacted ${s.company.shortName}.`
      : `Sent to ${s.company.shortName} staff. Who receives which email is set under Email and alerts in the dashboard.`);
  const tone = o.status ? TONES[o.status.tone] : null;
  return html`<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${o.heading}</title>
${raw('<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->')}
<style>${raw(STYLE_BASE)}</style>
<style>${raw(STYLE_DARK)}</style>
<style>${raw(STYLE_OUTLOOK_DARK)}</style>
</head>
<body class="em-page" style="margin:0;padding:0;background-color:${raw(C.page)};">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${o.preheader}${raw("&#8199;&#847;".repeat(50))}</div>
<table role="presentation" class="em-page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${raw(C.page)};"><tr>
<td class="em-outer" align="center" style="padding:32px 16px 40px 16px;background-color:${raw(C.page)};">
${raw('<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->')}
<table role="presentation" class="em-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${raw(C.card)};border:1px solid ${raw(C.border)};border-radius:14px;border-collapse:separate;overflow:hidden;">
<tr><td height="4" style="height:4px;line-height:4px;font-size:0;background-color:${raw(s.branding.primary)};">&nbsp;</td></tr>
<tr><td class="em-head em-px" style="padding:24px 32px 20px 32px;border-bottom:1px solid ${raw(C.border)};background-color:${raw(C.card)};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="em-stack" valign="middle">${letterhead(s, logoUrl)}</td>
${o.context ? html`<td class="em-stack em-ctx" valign="middle" align="right" style="padding:0 0 0 16px;text-align:right;font-family:${raw(FONT)};font-size:12px;line-height:16px;font-weight:600;color:${raw(C.muted)};" ><span class="em-muted">${o.context}</span></td>` : ""}
</tr></table>
</td></tr>
${
  o.status && tone
    ? html`<tr><td class="em-px" style="padding:28px 32px 0 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td class="em-chip-${raw(o.status.tone)}" style="padding:5px 12px 5px 10px;border-radius:999px;background-color:${raw(tone.bg)};font-family:${raw(FONT)};font-size:12px;line-height:16px;font-weight:700;color:${raw(tone.fg)};white-space:nowrap;"><span style="color:${raw(tone.dot)};font-size:11px;">&#9679;</span>&nbsp;&nbsp;${o.status.label}</td></tr></table></td></tr>`
    : ""
}
<tr><td class="em-px" style="padding:${raw(o.status ? "14px" : "30px")} 32px 10px 32px;">
<h1 class="em-h1" style="margin:0 0 18px 0;font-family:${raw(FONT)};font-size:23px;line-height:30px;font-weight:700;letter-spacing:-0.01em;color:${raw(C.ink)};">${o.heading}</h1>
${o.body}
</td></tr>
${brandStrip(ctx)}
</table>
${raw("<!--[if mso]></td></tr></table><![endif]-->")}
${companyFooter(s, reason)}
</td></tr></table>
</body>
</html>`.value;
}

/** The plain-text part's closing lines. */
function textFooter(s: Settings) {
  return [
    "",
    "--",
    s.company.name,
    s.contact.address,
    [s.contact.phone, s.contact.email].filter(Boolean).join(" | "),
    siteUrl().replace(/^https?:\/\//, ""),
  ]
    .filter((l) => l !== undefined && l !== null)
    .join("\n");
}

// ---------- Templates ----------

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
  equipment: "Equipment",
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

const multiline = (v: string) => v.split(/\n/).flatMap((l, i) => (i ? [raw("<br>"), l] : [l]));

/**
 * Acknowledgement to the customer. Only fixed wording and values we control go in this email
 * (reference, request type, desk, catalogue product name). The visitor's own text stays out, so the
 * form can't be used to send someone else a branded message. No staff names either.
 */
export function customerAck(ctx: EmailCtx, e: EnquiryForMail) {
  const { s } = ctx;
  const color = s.branding.primary;
  const reach: HtmlValue[] = [];
  if (e.deskPhone) reach.push(html`call ${link(e.deskPhone, `tel:${e.deskPhone.replace(/[^\d+]/g, "")}`, color)}`);
  if (e.deskEmail) reach.push(html`email ${link(e.deskEmail, `mailto:${e.deskEmail}`, color)}`);
  const urgent = e.details.urgency === "machine_down";
  const body = html`${para("Hello,")}
${para(html`Thank you for contacting ${s.company.shortName}. Your ${e.typeLabel.toLowerCase()} has reached our ${strong(e.deskLabel.toLowerCase())} team and someone will get back to you shortly.`)}
${urgent ? callout(html`<strong>Marked as urgent.</strong> You told us the machine is down, so the team will treat this first.`, "warning") : ""}
${highlight("Your reference", e.ref, "Please quote it if you contact us about this request.")}
${details([["Request", e.typeLabel], ["Product", e.product], ["Handled by", e.deskLabel]])}
${reach.length ? para(html`Need us sooner? ${reach.flatMap((r, i) => (i ? [" or ", r] : [r]))}.`) : ""}`;
  const text = `Hello,

Thank you for contacting ${s.company.shortName}. Your ${e.typeLabel.toLowerCase()} has reached our ${e.deskLabel.toLowerCase()} team and someone will get back to you shortly.
${urgent ? "\nYou told us the machine is down, so we have marked this as urgent.\n" : ""}
Your reference: ${e.ref}
${e.product ? `Product: ${e.product}\n` : ""}
${e.deskPhone ? `Phone: ${e.deskPhone}\n` : ""}${e.deskEmail ? `Email: ${e.deskEmail}\n` : ""}${textFooter(s)}`;
  return {
    subject: `We've received your ${e.typeLabel.toLowerCase()} (${e.ref})`,
    html: layout(ctx, {
      preheader: `Reference ${e.ref}. Our ${e.deskLabel.toLowerCase()} team will be in touch.`,
      heading: "We've received your request",
      status: { label: "Received", tone: "success" },
      body,
      audience: "customer",
    }),
    text,
  };
}

/** Notification to the people who handle the enquiry's desk. */
export function teamNotice(ctx: EmailCtx, e: EnquiryForMail, adminLink: string) {
  const { s } = ctx;
  const urgent = e.details.urgency === "machine_down";
  const via = e.source === "ENYO" ? "the Enyo chat" : "the website form";
  const body = html`${urgent ? callout(html`<strong>Machine down.</strong> The customer needs an urgent response.`, "warning") : ""}
${para(html`A new ${e.typeLabel.toLowerCase()} came in through ${via}.`)}
${details([
  ["Reference", e.ref],
  ["Name", e.name],
  ["Company", e.company],
  ["Email", e.email ? link(e.email, `mailto:${e.email}`, s.branding.primary) : null],
  ["Phone", e.phone ? link(e.phone, `tel:${e.phone.replace(/[^\d+]/g, "")}`, s.branding.primary) : null],
  ["Product", e.product],
  ...detailPairs(e),
  ["Photos and files", e.attachments ? String(e.attachments) : null],
])}
<p class="em-muted" style="margin:0 0 6px 0;font-family:${raw(FONT)};font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${raw(C.muted)};">Message</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;"><tr><td class="em-body" style="padding:2px 0 2px 14px;border-left:3px solid ${raw(C.border)};font-family:${raw(FONT)};font-size:15px;line-height:1.6;color:${raw(C.body)};">${multiline(e.message)}</td></tr></table>
${button(s, "Open in the dashboard", adminLink)}
${para("Reply from the dashboard so the customer gets a branded email and the reply is kept with the enquiry.", true)}`;
  const text = `New ${e.typeLabel} (${e.ref}) through ${via}
${urgent ? "MACHINE DOWN: urgent response needed\n" : ""}
Name: ${e.name}
${e.company ? `Company: ${e.company}\n` : ""}Email: ${e.email}
${e.phone ? `Phone: ${e.phone}\n` : ""}${e.product ? `Product: ${e.product}\n` : ""}${detailPairs(e)
    .map(([k, v]) => `${k}: ${v}\n`)
    .join("")}
Message:
${e.message}

Open in the dashboard: ${adminLink}`;
  return {
    subject: `${urgent ? "URGENT: " : ""}${e.typeLabel} from ${e.name}${e.company ? `, ${e.company}` : ""} (${e.ref})`,
    html: layout(ctx, {
      preheader: `${e.typeLabel} from ${e.name}${e.company ? `, ${e.company}` : ""}`,
      heading: `${e.typeLabel} ${e.ref}`,
      status: urgent ? { label: "Machine down", tone: "warning" } : { label: "New enquiry", tone: "neutral" },
      context: e.deskLabel,
      body,
      audience: "staff",
    }),
    text,
  };
}

/** Reply from staff to the customer, written in the dashboard. */
export function staffReply(ctx: EmailCtx, ref: string, name: string, message: string) {
  const { s } = ctx;
  const first = name.trim().split(/\s+/)[0] ?? "";
  const body = html`${para(first ? `Hello ${first},` : "Hello,")}
${message
  .trim()
  .split(/\n{2,}/)
  .map((p) => para(multiline(p)))}
${para(html`Kind regards,<br>${strong(s.company.shortName)}`)}
${details([["Your reference", ref]])}`;
  return {
    subject: `Re: your request ${ref}`,
    html: layout(ctx, { preheader: message.replace(/\s+/g, " ").slice(0, 110), heading: `About your request ${ref}`, body, audience: "customer" }),
    text: `${first ? `Hello ${first},` : "Hello,"}\n\n${message.trim()}\n\nKind regards,\n${s.company.shortName}\n\nYour reference: ${ref}\n${textFooter(s)}`,
  };
}

/** Staff notice that a visitor left a testimonial to approve. */
export function testimonialNotice(ctx: EmailCtx, t: { name: string; company?: string | null; rating: number; quote: string }, adminLink: string) {
  const { s } = ctx;
  const stars = "★".repeat(Math.max(0, Math.min(5, t.rating))) + "☆".repeat(5 - Math.max(0, Math.min(5, t.rating)));
  const body = html`${para(html`${strong(t.name)}${t.company ? `, ${t.company}` : ""} left a testimonial on the website.`)}
<table role="presentation" class="em-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;background-color:${raw(C.surface)};border:1px solid ${raw(C.border)};border-radius:10px;border-collapse:separate;"><tr><td style="padding:16px 18px;font-family:${raw(FONT)};">
<p style="margin:0 0 8px 0;font-size:16px;letter-spacing:2px;color:#d97706;" aria-label="${t.rating} out of 5">${stars}</p>
<p class="em-strong" style="margin:0;font-size:15px;line-height:1.6;font-style:italic;color:${raw(C.ink)};">&ldquo;${multiline(t.quote)}&rdquo;</p>
</td></tr></table>
${para("It won't appear on the site until someone approves it. You can edit the wording or reject it from the dashboard.")}
${button(s, "Review testimonials", adminLink)}`;
  return {
    subject: `New testimonial to review from ${t.name}`,
    html: layout(ctx, {
      preheader: t.quote.replace(/\s+/g, " ").slice(0, 100),
      heading: "A testimonial is waiting for approval",
      status: { label: "Needs approval", tone: "neutral" },
      body,
      audience: "staff",
    }),
    text: `${t.name}${t.company ? `, ${t.company}` : ""} left a ${t.rating}-star testimonial.\n\n"${t.quote}"\n\nIt won't appear on the site until someone approves it.\nReview it: ${adminLink}`,
  };
}

/** The daily list of enquiries nobody has answered in time. */
export function overdueDigest(
  ctx: EmailCtx,
  deskLabel: string,
  items: { ref: string; name: string; type: string; hours: number; urgent: boolean; link: string }[],
  adminLink: string,
) {
  const { s } = ctx;
  const line = (i: number) => raw(i ? `border-top:1px solid ${C.border};` : "");
  const rows = items.map(
    (i, n) => html`<tr>
<td class="em-line" valign="top" style="padding:11px 12px 11px 16px;font-family:${raw(FONT)};font-size:14px;line-height:1.4;${line(n)}"><a href="${href(i.link)}" class="em-strong" style="color:${raw(C.ink)};font-weight:700;text-decoration:none;white-space:nowrap;">${i.ref}</a></td>
<td class="em-line" valign="top" style="padding:11px 12px 11px 0;font-family:${raw(FONT)};font-size:14px;line-height:1.4;${line(n)}"><span class="em-strong" style="color:${raw(C.ink)};">${i.name}</span><br><span class="em-muted" style="font-size:12.5px;color:${raw(C.muted)};">${i.type}${i.urgent ? " · machine down" : ""}</span></td>
<td class="em-line" valign="top" align="right" style="padding:11px 16px 11px 0;font-family:${raw(FONT)};font-size:13px;line-height:1.4;white-space:nowrap;font-weight:600;color:${raw(i.urgent ? "#b45309" : C.muted)};${line(n)}">${i.hours} h</td>
</tr>`,
  );
  const n = items.length;
  const body = html`${para(html`${n === 1 ? "This enquiry is" : `These ${n} enquiries are`} still open without a reply after the ${s.enquiries.overdueHours}-hour target${items.some((i) => i.urgent) ? ", or have a machine down" : ""}.`)}
<table role="presentation" class="em-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px 0;border:1px solid ${raw(C.border)};border-radius:10px;background-color:${raw(C.surface)};border-collapse:separate;">${rows}</table>
${button(s, "Open the enquiries", adminLink)}`;
  return {
    subject: `${n} overdue ${n === 1 ? "enquiry" : "enquiries"} for ${deskLabel}`,
    html: layout(ctx, {
      preheader: `${n} waiting for a reply`,
      heading: `Waiting for a reply`,
      status: { label: `${n} overdue`, tone: "warning" },
      context: deskLabel,
      body,
      audience: "staff",
      reason: `The daily reminder for the ${deskLabel.toLowerCase()} desk. It can be switched off under Email and alerts in the dashboard.`,
    }),
    text: `${n} overdue ${n === 1 ? "enquiry" : "enquiries"} for ${deskLabel}:\n\n${items.map((i) => `${i.ref}  ${i.name} (${i.type}${i.urgent ? ", machine down" : ""}), ${i.hours} h\n${i.link}`).join("\n\n")}\n\nAll open enquiries: ${adminLink}`,
  };
}

/** Sent from Email and alerts to check the mail server. */
export function testMessage(ctx: EmailCtx, who: { name: string; source: string }) {
  const { s } = ctx;
  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date());
  const first = who.name.trim().split(/\s+/)[0];
  const body = html`${para(first ? `Hello ${first},` : "Hello,")}
${para("This is a test from Email and alerts. If you can read it, the mail server is working and emails from the website will reach people.")}
${details([
  ["Sent", `${when} (Lagos)`],
  ["Mail server", who.source],
  ["From", `${s.email.fromName || s.company.shortName}`],
  ["Replies go to", s.email.replyTo || "The sender address"],
])}
${para("This is how every email from the website looks: your letterhead at the top and your brands at the foot.", true)}`;
  return {
    subject: `Test email from ${s.company.shortName}`,
    html: layout(ctx, { preheader: "The mail server is working.", heading: "Your email is set up", status: { label: "Test", tone: "success" }, body, audience: "staff" }),
    text: `This is a test from Email and alerts. If you can read it, the mail server is working.\nSent ${when} (Lagos) through ${who.source}.\n${textFooter(s)}`,
  };
}

// ---------- Previews for the dashboard ----------

export const EMAIL_KINDS = [
  { key: "customerAck", label: "Customer confirmation", to: "The customer" },
  { key: "teamNotice", label: "New enquiry", to: "The team" },
  { key: "staffReply", label: "Staff reply", to: "The customer" },
  { key: "testimonialNotice", label: "Testimonial waiting", to: "The team" },
  { key: "overdueDigest", label: "Daily overdue list", to: "The team" },
] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number]["key"];

/** Every email rendered with made-up details, for the preview on Email and alerts. */
export function sampleEmails(ctx: EmailCtx): Record<EmailKind, { subject: string; html: string }> {
  const base = siteUrl();
  const desk = Object.values(ctx.s.desks)[1] ?? Object.values(ctx.s.desks)[0];
  const e: EnquiryForMail = {
    ref: "CN-2026-000123",
    type: "SERVICE_BOOKING",
    typeLabel: "Service request",
    source: "FORM",
    name: "Adaeze Okafor",
    email: "adaeze@example.com",
    phone: "0803 000 0000",
    company: "Okafor Construction Ltd",
    message: "Our excavator shows a hydraulic warning and the boom is slow to lift.\nIt is on site in Lekki.",
    product: "LiuGong 922F",
    deskLabel: desk?.label ?? "Field service",
    deskPhone: desk?.phone || ctx.s.contact.phone,
    deskEmail: desk?.email || ctx.s.contact.email,
    details: { machine: "LiuGong 922F excavator", serialNumber: "LG922F0001", hourMeter: "4,210", siteLocation: "Lekki, Lagos", urgency: "machine_down" },
    attachments: 2,
  };
  const pick = (m: { subject: string; html: string }) => ({ subject: m.subject, html: m.html });
  return {
    customerAck: pick(customerAck(ctx, e)),
    teamNotice: pick(teamNotice(ctx, e, `${base}/admin/enquiries`)),
    staffReply: pick(
      staffReply(
        ctx,
        e.ref,
        e.name,
        "Thank you for the details. Our technician, based in Lagos, can be on site tomorrow morning between 9:00 and 11:00.\n\nPlease make sure the machine can be reached and someone is there to show us the fault.",
      ),
    ),
    testimonialNotice: pick(
      testimonialNotice(ctx, { name: "Ibrahim Musa", company: "Northgate Logistics", rating: 5, quote: "The technician came to our warehouse the same day and had the forklift working before the evening shift." }, `${base}/admin/testimonials`),
    ),
    overdueDigest: pick(
      overdueDigest(
        ctx,
        desk?.label ?? "Field service",
        [
          { ref: "CN-2026-000118", name: "Tunde Bakare", type: "Service request", hours: 52, urgent: true, link: `${base}/admin/enquiries` },
          { ref: "CN-2026-000120", name: "Grace Eze", type: "Parts request", hours: 31, urgent: false, link: `${base}/admin/enquiries` },
          { ref: "CN-2026-000121", name: "Musa Bello", type: "Quote request", hours: 26, urgent: false, link: `${base}/admin/enquiries` },
        ],
        `${base}/admin/enquiries?status=open`,
      ),
    ),
  };
}
