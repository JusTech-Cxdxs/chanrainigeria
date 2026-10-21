import { SaveBar } from "@/components/admin/cms";
import type { Metadata } from "next";
import Link from "next/link";
import { saveEmailSettings, sendTestEmail } from "@/app/admin/actions/email";
import { EmailPreview, SecretInput, TestEmailForm } from "@/components/admin/EmailTools";
import { Section, SectionedPage, StatusPill } from "@/components/admin/Sections";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/auth";
import { EMAIL_KINDS, sampleEmails } from "@/lib/email-templates";
import { emailContext, enquiryRecipients, mailSource, optedInStaff, parseAddresses, testimonialRecipients } from "@/lib/mail";
import { open } from "@/lib/secret-box";
import { deskFor } from "@/lib/settings";

export const metadata: Metadata = { title: "Email and alerts" };

const LINKS = [
  { id: "sender", label: "Sender", icon: "mail" },
  { id: "server", label: "Mail server", icon: "server" },
  { id: "alerts", label: "Alert routing", icon: "route" },
  { id: "look", label: "Email look", icon: "palette" },
  { id: "test", label: "Test email", icon: "send" },
  { id: "where", label: "Which email goes where", icon: "help" },
  { id: "preview", label: "Preview", icon: "eye" },
];

const PROVIDERS = [
  ["Microsoft 365 / Outlook", "smtp.office365.com", "587", "STARTTLS"],
  ["Google Workspace / Gmail", "smtp.gmail.com", "587", "STARTTLS"],
  ["Zoho Mail", "smtp.zoho.com", "465", "SSL/TLS"],
  ["Brevo", "smtp-relay.brevo.com", "587", "STARTTLS"],
];

function Addresses({ list, empty = "Nobody" }: { list: string[]; empty?: string }) {
  if (!list.length) return <span className="text-ink-soft">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {list.map((a) => (
        <span key={a} className="rounded-full border border-line bg-concrete px-2.5 py-0.5 text-xs font-medium">
          {a}
        </span>
      ))}
    </span>
  );
}

export default async function EmailPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin("email");
  const sp = await searchParams;
  const ctx = await emailContext();
  const s = ctx.s;
  const source = mailSource(s);
  const smtp = s.email.smtp;
  const hasPass = !!smtp.passEnc;
  const passBroken = hasPass && open(smtp.passEnc) === null;
  const staff = await optedInStaff().catch(() => []);
  const deskKeys = Object.keys(s.desks);
  const routes = await Promise.all(deskKeys.map((k) => enquiryRecipients(s, k, staff)));
  const testimonialTo = await testimonialRecipients(s, staff);
  const samples = sampleEmails(ctx);
  const deskLabel = (k: string) => s.desks[k]?.label ?? k;

  const sourceBox =
    source === "dashboard" ? (
      <StatusPill tone={passBroken ? "warn" : "ok"}>{passBroken ? "Password needs typing again" : "Using the settings below"}</StatusPill>
    ) : source === "environment" ? (
      <StatusPill tone="ok">Using the server&apos;s own settings</StatusPill>
    ) : (
      <StatusPill tone="warn">Not connected</StatusPill>
    );

  return (
    <>
      <AdminHead
        title="Email and alerts"
        lead="The mail server the website sends from, who gets told about new enquiries and testimonials, and how every email looks. Changes apply to the next email sent."
      />
      <Flash sp={sp} />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: "server",
            label: "Mail server",
            value: source === "dashboard" ? `${smtp.host}:${smtp.port}` : source === "environment" ? "Server environment" : "Not set up",
            tone: source === "none" || passBroken ? "warn" : "ok",
          },
          { icon: "mail", label: "Sends as", value: `${s.email.fromName || s.company.shortName}${s.email.fromAddress ? ` <${s.email.fromAddress}>` : ""}`, tone: "ok" },
          { icon: "bell", label: "Staff with alerts on", value: staff.length ? `${staff.length} ${staff.length === 1 ? "person" : "people"}` : "Nobody yet", tone: staff.length ? "ok" : "off" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${c.tone === "warn" ? "bg-accent/15 text-[color-mix(in_oklab,var(--accent)_60%,var(--ink))]" : "bg-brand/10 text-brand"}`} aria-hidden>
              <Icon name={c.icon} size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{c.label}</span>
              <span className="block truncate font-semibold">{c.value}</span>
            </span>
          </div>
        ))}
      </div>

      <SectionedPage links={LINKS}>
        <div className="grid grid-cols-1 gap-6">
          <form action={saveEmailSettings} className="grid grid-cols-1 gap-6">
            <Section id="sender" icon="mail" title="Sender" lead="The name and address people see in their inbox, and where their replies go.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sender name" name="fromName" defaultValue={s.email.fromName} placeholder={s.company.shortName} hint="Usually the company name, e.g. Chanrai Nigeria." />
                <Field
                  label="Sender address"
                  name="fromAddress"
                  type="email"
                  defaultValue={s.email.fromAddress}
                  placeholder="website@chanrainigeria.com"
                  hint="Must be an address your mail server allows you to send from. Left empty, the mail server username is used."
                />
                <Field
                  label="Replies go to"
                  name="replyTo"
                  type="email"
                  defaultValue={s.email.replyTo}
                  hint="When a customer presses Reply. Replies to enquiry emails go to the desk instead."
                  className="sm:col-span-2"
                />
              </div>
            </Section>

            <Section id="server" icon="server" title="Mail server" lead="The account the website sends email through. Your IT team or email provider can give you these details." aside={sourceBox}>
              <div className="mb-5 grid gap-1 rounded-xl border border-line bg-concrete px-4 py-3 text-sm">
                <p className="font-semibold">Which settings are in use</p>
                <ul className="grid gap-1 text-ink-soft">
                  <li className="flex items-center gap-2">
                    <Icon name={source === "dashboard" ? "check-circle" : "x"} size={15} className={source === "dashboard" ? "text-brand" : ""} />
                    Settings on this page{source === "dashboard" ? " (in use)" : ": fill in the server name to use them"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name={source === "environment" ? "check-circle" : "x"} size={15} className={source === "environment" ? "text-brand" : ""} />
                    Server environment set by whoever hosts the website
                    {source === "environment" ? " (in use)" : process.env.SMTP_HOST ? " (available as a fallback)" : " (not set)"}
                  </li>
                </ul>
                {source === "none" ? <p className="mt-1 text-[color-mix(in_oklab,var(--accent)_60%,var(--ink))]">No emails are going out. Enquiries are still saved in the dashboard.</p> : null}
                {passBroken ? <p className="mt-1 text-danger">The saved password can&apos;t be read on this server any more. Type it again and save.</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-6">
                <Field label="Server name" name="smtpHost" defaultValue={smtp.host} placeholder="smtp.office365.com" className="sm:col-span-4" hint="Leave empty to use the server environment instead." />
                <Field label="Port" name="smtpPort" type="number" defaultValue={smtp.port} className="sm:col-span-2" hint="587 or 465 in most cases." />
                <label className="field sm:col-span-2">
                  <span>Security</span>
                  <select name="smtpSecurity" defaultValue={smtp.secure ? "ssl" : "starttls"} className="input">
                    <option value="starttls">STARTTLS (port 587)</option>
                    <option value="ssl">SSL/TLS (port 465)</option>
                  </select>
                  <small>Match the port your provider gives.</small>
                </label>
                <Field label="Username" name="smtpUser" defaultValue={smtp.user} placeholder="website@chanrainigeria.com" className="sm:col-span-4" hint="Usually the full email address." />
                <div className="sm:col-span-4">
                  <SecretInput
                    name="smtpPass"
                    saved={hasPass}
                    label="Password"
                    hint="Stored encrypted and never shown again. Leave empty to keep the current password. Accounts with two-step sign-in need an app password."
                  />
                </div>
                <div className="flex items-end pb-7 sm:col-span-2">{hasPass ? <Check label="Remove the saved password" name="smtpClearPass" /> : null}</div>
              </div>
              <details className="mt-2 rounded-xl border border-line-soft px-4 py-3 text-sm">
                <summary className="cursor-pointer font-semibold">Common settings</summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-ink-soft">
                      <tr>
                        <th className="py-1.5 pr-4 font-semibold">Provider</th>
                        <th className="py-1.5 pr-4 font-semibold">Server name</th>
                        <th className="py-1.5 pr-4 font-semibold">Port</th>
                        <th className="py-1.5 font-semibold">Security</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PROVIDERS.map((p) => (
                        <tr key={p[0]} className="border-t border-line-soft">
                          {p.map((c, i) => (
                            <td key={i} className={`py-1.5 pr-4 ${i === 1 ? "font-mono text-xs" : ""}`}>
                              {c}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </Section>

            <Section id="alerts" icon="route" title="Alert routing" lead="Who is told when an enquiry or a testimonial comes in. People can also turn alerts on for themselves on the Team page.">
              <div className="grid gap-5">
                <Check
                  label="Send new enquiries to the desk's own inbox"
                  name="deskInbox"
                  defaultChecked={s.alerts.deskInbox}
                  hint="Each desk's email is set in Company settings under Contacts and desks. Desks without one use the main company email."
                />
                <Field
                  label="Also send every new enquiry to"
                  name="alsoEmail"
                  defaultValue={s.alerts.alsoEmail}
                  textarea
                  rows={2}
                  placeholder="manager@chanrainigeria.com, sales.lead@chanrainigeria.com"
                  hint="Separate addresses with commas. They get every enquiry, whatever the desk."
                />
                <Field
                  label="Testimonials waiting for approval go to"
                  name="testimonialsTo"
                  defaultValue={s.alerts.testimonialsTo}
                  placeholder="marketing@chanrainigeria.com"
                  hint="Left empty: staff with alerts on whose role can approve testimonials, or else the main company email."
                />
                <Check
                  label="Send a daily list of overdue enquiries"
                  name="overdueDigest"
                  defaultChecked={s.alerts.overdueDigest}
                  hint={`At 8:00 Lagos time, to the same people as each desk's new enquiries. Enquiries count as overdue after ${s.enquiries.overdueHours} hours (Company settings).${s.enquiries.sendDailyReminder ? "" : " The daily reminder is switched off in Company settings, so nothing is sent until it is turned on there too."}`}
                />
                <div className="rounded-xl border border-line-soft">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-4 py-3">
                    <p className="font-semibold">Staff with alerts on</p>
                    <Link href="/admin/team" className="text-sm font-semibold text-brand hover:underline">
                      Change on the Team page
                    </Link>
                  </div>
                  {staff.length ? (
                    <ul className="divide-y divide-line-soft">
                      {staff.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                          <span className="min-w-0">
                            <span className="font-semibold">{p.name}</span> <span className="text-ink-soft">{p.email}</span>
                          </span>
                          <span className="text-ink-soft">
                            {!(p.perms.includes("*") || p.perms.includes("enquiries"))
                              ? "No enquiry access, so only testimonials"
                              : p.desks.length
                                ? p.desks.map(deskLabel).join(", ")
                                : "All desks"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-4 text-sm text-ink-soft">Nobody has turned on email alerts yet.</p>
                  )}
                </div>
              </div>
            </Section>

            <Section id="look" icon="palette" title="Email look" lead="Your logo and brand colour come from Company settings. The brands shown at the foot of each email are chosen under Brands.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Heading over the brand logos" name="brandsLabel" defaultValue={s.email.brandsLabel} hint="For example: Authorised dealer for." />
                <Field label="Line under the company details" name="footerNote" defaultValue={s.email.footerNote} hint="For example: A business of the Kewalram Chanrai Group." />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-ink-soft">Brands in the strip:</span>
                {ctx.brands.length ? (
                  ctx.brands.map((b) => (
                    <span key={b.name} className="rounded-full border border-line px-2.5 py-0.5 font-semibold">
                      {b.name}
                      {b.relationship ? <span className="font-normal text-ink-soft">, {b.relationship}</span> : null}
                    </span>
                  ))
                ) : (
                  <span className="text-ink-soft">None. The strip is left out.</span>
                )}
                <Link href="/admin/catalogue/brands" className="font-semibold text-brand hover:underline">
                  Choose under Brands
                </Link>
              </div>
            </Section>

            <SaveBar note="The test email and preview below use the saved settings.">

              <SubmitButton>

                <Icon name="save" size={17} /> Save email settings

              </SubmitButton>

            </SaveBar>
          </form>

          <Section id="test" icon="send" title="Send a test email" lead="Check the mail server works before you rely on it.">
            <TestEmailForm action={sendTestEmail} to={user.email} disabled={source === "none" ? "Set up the mail server above and save before sending a test." : undefined} />
          </Section>

          <Section id="where" icon="help" title="Which email goes where" lead="Every email the website sends, and who receives it with the settings as they are now.">
            <div className="-mx-5 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-ink-soft">
                  <tr className="border-b border-line">
                    <th className="px-5 py-2 font-semibold sm:px-0 sm:pr-4">Email</th>
                    <th className="py-2 pr-4 font-semibold">Sent when</th>
                    <th className="py-2 pr-5 font-semibold sm:pr-0">Goes to</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-b border-line-soft">
                    <td className="px-5 py-3 font-semibold sm:px-0 sm:pr-4">Customer confirmation</td>
                    <td className="py-3 pr-4 text-ink-soft">Someone sends an enquiry, booking or parts request from the website or Enyo.</td>
                    <td className="py-3 pr-5 sm:pr-0">The customer. It gives their reference and the desk&apos;s phone and email, and never repeats what they typed.</td>
                  </tr>
                  <tr className="border-b border-line-soft">
                    <td className="px-5 py-3 font-semibold sm:px-0 sm:pr-4">New enquiry</td>
                    <td className="py-3 pr-4 text-ink-soft">The same moment, with everything the customer sent.</td>
                    <td className="py-3 pr-5 sm:pr-0">
                      <p className="mb-2 text-ink-soft">The desk inbox{s.alerts.deskInbox ? "" : " (switched off)"}, the extra addresses and staff with alerts on for that desk. Right now:</p>
                      <ul className="grid gap-2">
                        {routes.map((r, i) => (
                          <li key={deskKeys[i]} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                            <span className="font-semibold">{deskFor(s, deskKeys[i]).label}</span>
                            <Addresses list={r.all} />
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr className="border-b border-line-soft">
                    <td className="px-5 py-3 font-semibold sm:px-0 sm:pr-4">Staff reply</td>
                    <td className="py-3 pr-4 text-ink-soft">Someone replies to an enquiry from the dashboard.</td>
                    <td className="py-3 pr-5 sm:pr-0">The customer. Their replies go to the desk&apos;s email.</td>
                  </tr>
                  <tr className="border-b border-line-soft">
                    <td className="px-5 py-3 font-semibold sm:px-0 sm:pr-4">Testimonial waiting</td>
                    <td className="py-3 pr-4 text-ink-soft">A visitor shares a testimonial on the website.</td>
                    <td className="py-3 pr-5 sm:pr-0">
                      <p className="mb-2 text-ink-soft">
                        {parseAddresses(s.alerts.testimonialsTo).length
                          ? "The addresses set above."
                          : "Staff with alerts on who can approve testimonials, or else the main company email."}
                      </p>
                      <Addresses list={testimonialTo.all} />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold sm:px-0 sm:pr-4">Daily overdue list</td>
                    <td className="py-3 pr-4 text-ink-soft">8:00 each morning, for desks with enquiries waiting longer than {s.enquiries.overdueHours} hours or a machine down.</td>
                    <td className="py-3 pr-5 sm:pr-0">
                      {s.alerts.overdueDigest && s.enquiries.sendDailyReminder ? "The same people as each desk's new enquiries." : <span className="text-ink-soft">Switched off. Nothing is sent.</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-ink-soft">If a list would be empty, the email goes to the main company email ({s.contact.email || "not set"}) so nothing is missed.</p>
          </Section>

          <Section id="preview" icon="eye" title="Preview" lead="How each email looks, with sample details.">
            <EmailPreview emails={EMAIL_KINDS.map((k) => ({ key: k.key, label: k.label, to: k.to, ...samples[k.key] }))} />
          </Section>
        </div>
      </SectionedPage>
    </>
  );
}
