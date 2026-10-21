import type { Metadata } from "next";
import Link from "next/link";
import { refreshSiteCache, saveSettings } from "@/app/admin/actions/settings";
import { Section, SectionedPage, StatusPill } from "@/components/admin/Sections";
import { AdminHead, Check, Field, Flash, SubmitButton } from "@/components/admin/ui";
import { Icon } from "@/components/ui/Icon";
import { has, requireAdmin } from "@/lib/auth";
import { enyoAiConfigured } from "@/lib/enyo";
import { getSettings, mediaUrl } from "@/lib/settings";

export const metadata: Metadata = { title: "Company settings" };

const LINKS = [
  { id: "company", label: "Company", icon: "building" },
  { id: "contacts", label: "Contacts and desks", icon: "contact" },
  { id: "look", label: "Look and feel", icon: "palette" },
  { id: "languages", label: "Languages", icon: "languages" },
  { id: "enyo", label: "Enyo website assistant", icon: "sparkles" },
  { id: "privacy", label: "Privacy", icon: "shield" },
  { id: "seo", label: "Search engines", icon: "search" },
];

const LANGUAGES = [
  ["fr", "French"],
  ["zh-CN", "Chinese"],
  ["hi", "Hindi"],
  ["ar", "Arabic"],
  ["pt", "Portuguese"],
  ["es", "Spanish"],
  ["de", "German"],
  ["ha", "Hausa"],
  ["yo", "Yoruba"],
  ["ig", "Igbo"],
];

const SOCIAL = [
  ["linkedin", "LinkedIn", "https://www.linkedin.com/company/…"],
  ["facebook", "Facebook", "https://www.facebook.com/…"],
  ["instagram", "Instagram", "https://www.instagram.com/…"],
  ["x", "X", "https://x.com/…"],
  ["youtube", "YouTube", "https://www.youtube.com/@…"],
] as const;

function SubHead({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 mt-1">
      <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-ink-soft">{children}</h3>
      {hint ? <p className="mt-0.5 text-sm text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireAdmin("settings");
  const sp = await searchParams;
  const s = await getSettings();
  const ai = enyoAiConfigured();

  const LogoInput = ({ k, label, hint }: { k: "logoId" | "logoDarkId" | "faviconId"; label: string; hint: string }) => (
    <div className="field">
      <span>{label}</span>
      {s.branding[k] ? (
        <div className={`flex items-center gap-4 rounded-xl border border-line p-3 ${k === "logoDarkId" ? "bg-[#0d1b12]" : "bg-concrete"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(s.branding[k])!} alt="" className="h-10 w-auto" />
          <span className={k === "logoDarkId" ? "text-white" : ""}>
            <Check label="Remove" name={`remove_${k}`} />
          </span>
        </div>
      ) : null}
      <input type="file" name={k} accept="image/*" className="input py-2" />
      <small>{hint}</small>
    </div>
  );

  return (
    <>
      <AdminHead
        title="Company settings"
        lead="The company details the website, emails and Enyo use. Nothing here is fixed in the code."
        actions={
          has(user, "email") ? (
            <Link href="/admin/email" className="btn btn-outline">
              <Icon name="mail" size={17} />
              Email and alerts
            </Link>
          ) : undefined
        }
      />
      {sp.welcome ? (
        <p className="mb-6 rounded-xl border-l-4 border-brand bg-surface px-4 py-3">
          Welcome. Start with the company details, desk contacts and logo, then save. You can come back any time.
        </p>
      ) : null}
      <Flash sp={sp} />

      <SectionedPage links={LINKS}>
        <form action={saveSettings} className="grid grid-cols-1 gap-6">
          <Section id="company" icon="building" title="Company" lead="Names and descriptions used across the website, in page titles and in every email.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Registered name" name="company_name" defaultValue={s.company.name} required hint="The full legal name, e.g. Chanrai Nigeria Limited. Shown in the footer and emails." />
              <Field label="Short name" name="company_shortName" defaultValue={s.company.shortName} hint="Used in the header, emails and page titles." />
              <Field label="Tagline" name="company_tagline" defaultValue={s.company.tagline} className="sm:col-span-2" hint="One sentence about what you do. Shown on the home page and in search results." />
              <Field
                label="About the company"
                name="company_about"
                defaultValue={s.company.about}
                textarea
                rows={5}
                className="sm:col-span-2"
                hint="Shown on the About page and known by Enyo. Leave a blank line between paragraphs."
              />
              <Field label="Group name" name="company_groupName" defaultValue={s.company.groupName} hint="The parent group, if any." />
              <Field label="Group website" name="company_groupUrl" defaultValue={s.company.groupUrl} type="url" hint="Must start with https://." />
              <Field label="Heritage line" name="company_heritage" defaultValue={s.company.heritage} className="sm:col-span-2" hint="A short line about the group's history, shown on the About page." />
              <Field
                label="Group line"
                name="company_groupLine"
                defaultValue={s.company.groupLine}
                className="sm:col-span-2"
                hint="Shown on the home page slider and in the footer, e.g. A business of the Kewalram Chanrai Group."
              />
            </div>
            <div className="mt-6 border-t border-line-soft pt-5">
              <SubHead hint="Full https:// links. Empty ones are hidden on the website.">Social media</SubHead>
              <div className="grid gap-4 sm:grid-cols-2">
                {SOCIAL.map(([k, label, ph]) => (
                  <Field key={k} label={label} name={`social_${k}`} type="url" defaultValue={s.social[k]} placeholder={ph} />
                ))}
              </div>
            </div>
          </Section>

          <Section
            id="contacts"
            icon="contact"
            title="Contacts and desks"
            lead="Each enquiry goes to one desk. Quotes go to the product line's desk, service bookings to Field service, parts requests to Parts, and everything for CNG to the CNG desk. Desks with no contact details are hidden on the website."
          >
            <SubHead>Main contact</SubHead>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Main email" name="contact_email" type="email" defaultValue={s.contact.email} hint="Used for any desk without its own email, and as the last resort for alerts." />
              <Field label="Main phone" name="contact_phone" defaultValue={s.contact.phone} hint="Shown in the header, footer and every email." />
              <Field label="Main WhatsApp" name="contact_whatsapp" defaultValue={s.contact.whatsapp} hint="The number for the WhatsApp button. Leave empty to hide it." />
              <Field label="Opening hours" name="contact_hours" defaultValue={s.contact.hours} hint="For example: Monday to Friday, 8:00 to 17:00." />
              <Field label="Address" name="contact_address" defaultValue={s.contact.address} className="sm:col-span-2" hint="Shown in the footer, in Enyo's Contact us card and in every email." />
            </div>

            <div className="mt-6 border-t border-line-soft pt-5">
              <SubHead hint={has(user, "email") ? "Whether new enquiries go to each desk's inbox is set under Email and alerts." : undefined}>Desks</SubHead>
              <div className="grid gap-4 lg:grid-cols-2">
                {Object.entries(s.desks).map(([k, d]) => (
                  <fieldset key={k} className="grid gap-3 rounded-xl border border-line-soft p-4">
                    <legend className="px-1 font-semibold">{d.label}</legend>
                    <Field label="Name shown" name={`desk_${k}_label`} defaultValue={d.label} hint="How the desk is named on the website and in emails." />
                    <Field label="Email" name={`desk_${k}_email`} type="email" defaultValue={d.email} hint="Receives this desk's enquiries. Empty uses the main email." />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Phone" name={`desk_${k}_phone`} defaultValue={d.phone} />
                      <Field label="WhatsApp" name={`desk_${k}_whatsapp`} defaultValue={d.whatsapp} />
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-line-soft pt-5">
              <SubHead>Response target</SubHead>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Overdue after (hours)"
                  name="enquiries_overdueHours"
                  type="number"
                  defaultValue={s.enquiries.overdueHours}
                  hint="An open enquiry with no progress after this long is marked overdue. Machines down are always flagged."
                />
                <Check
                  label="Send a daily reminder of overdue enquiries"
                  name="enquiries_sendDailyReminder"
                  defaultChecked={s.enquiries.sendDailyReminder}
                  hint="Sent at 8:00 Lagos time. Who receives it is set under Email and alerts."
                />
              </div>
            </div>
          </Section>

          <Section id="look" icon="palette" title="Look and feel" lead="Your logo and colours on the website, in the dashboard and in emails.">
            <div className="grid gap-5 sm:grid-cols-2">
              <LogoInput k="logoId" label="Logo" hint="PNG with a transparent background, at least 400 px wide. Emails need PNG or JPG (SVG logos are left out of emails)." />
              <LogoInput k="logoDarkId" label="Logo for dark mode (optional)" hint="A white or light version. Without it, the main logo is used." />
              <LogoInput k="faviconId" label="Browser tab icon (optional)" hint="Square PNG or SVG. Without it, the logo is used." />
              <div className="grid content-start gap-4">
                <label className="field">
                  <span>Brand colour</span>
                  <input type="color" name="branding_primary" defaultValue={s.branding.primary} className="input h-12 cursor-pointer p-1" />
                  <small>Buttons, links and drawings. Must be dark enough for white text.</small>
                </label>
                <label className="field">
                  <span>Highlight colour</span>
                  <input type="color" name="branding_accent" defaultValue={s.branding.accent} className="input h-12 cursor-pointer p-1" />
                  <small>Used sparingly for urgent things such as machine down.</small>
                </label>
                <Check label="Show the logo animation on a visitor's first page" name="branding_showLoader" defaultChecked={s.branding.showLoader} />
              </div>
            </div>
            <div className="mt-6 border-t border-line-soft pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <SubHead>Home page</SubHead>
                <Link href="/admin/appearance" className="mb-3 text-sm font-semibold text-brand hover:underline">
                  Edit the slider and pictures
                </Link>
              </div>
              <div className="grid gap-4">
                <Check label="Show testimonials on the home page" name="home_showTestimonials" defaultChecked={s.home.showTestimonials} />
                <Field label="Field service headline" name="home_fieldServiceTitle" defaultValue={s.home.fieldServiceTitle} hint="The heading of the dark green band about on-site service." />
                <Field label="Field service text" name="home_fieldServiceText" defaultValue={s.home.fieldServiceText} textarea rows={3} hint="One or two sentences under that heading." />
              </div>
            </div>
          </Section>

          <Section id="languages" icon="languages" title="Languages" lead="Visitors can read the website in another language. Translation is automatic and loads only when someone picks a language.">
            <Check label="Offer the website in other languages" name="translate_enabled" defaultChecked={s.translate.enabled} hint="Uses Google Translate. Nothing is sent to Google until a visitor picks a language." />
            <fieldset className="mt-5">
              <legend className="mb-2 text-[0.9375rem] font-semibold">Languages in the picker</legend>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
                {LANGUAGES.map(([code, label]) => (
                  <label key={code} className="flex items-center gap-2">
                    <input type="checkbox" name="translate_languages" value={code} defaultChecked={s.translate.languages.includes(code)} className="h-4 w-4 accent-[var(--brand)]" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </Section>

          <Section
            id="enyo"
            icon="sparkles"
            title="Enyo website assistant"
            lead="The chat on the public website that answers visitors and logs their requests."
            aside={<StatusPill tone={ai ? "ok" : "off"}>{ai ? "AI connected" : "Basic mode (no AI key)"}</StatusPill>}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Check label="Show Enyo on the website" name="enyo_enabled" defaultChecked={s.enyo.enabled} hint="Turned off, the chat button disappears from every page." />
              </div>
              <Field label="Name" name="enyo_name" defaultValue={s.enyo.name} hint="What the assistant calls itself." />
              <Field label="AI model" name="enyo_model" defaultValue={s.enyo.model} hint="From your AI provider, e.g. llama-3.3-70b-versatile on Groq. The dashboard assistant uses it too." />
              <Field label="Greeting" name="enyo_greeting" defaultValue={s.enyo.greeting} textarea rows={2} className="sm:col-span-2" hint="The first message a visitor sees when they open the chat." />
              <Field label="Tone" name="enyo_tone" defaultValue={s.enyo.tone} className="sm:col-span-2" hint="How Enyo should sound, e.g. warm, clear and professional. Short answers." />
              <Field
                label="Extra things Enyo should know"
                name="enyo_extraKnowledge"
                defaultValue={s.enyo.extraKnowledge}
                textarea
                rows={6}
                className="sm:col-span-2"
                hint="Facts not elsewhere on the site, e.g. which states you cover, public holidays, demo days. Enyo already knows the products, services, desks and locations. Never put prices or anything confidential here."
              />
            </div>
          </Section>

          <Section id="privacy" icon="shield" title="Privacy" lead="Shown on the privacy notice and cookie page.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Data controller" name="privacy_controllerName" defaultValue={s.privacy.controllerName} hint="The company responsible for visitors' personal data." />
              <Field label="Privacy notice last updated" name="privacy_lastUpdated" type="date" defaultValue={s.privacy.lastUpdated} hint="Change this when the notice changes." />
              <Field label="Data Protection Officer" name="privacy_dpoName" defaultValue={s.privacy.dpoName} hint="Name or role. Leave empty if you don't have one." />
              <Field label="DPO email" name="privacy_dpoEmail" type="email" defaultValue={s.privacy.dpoEmail} hint="Where people send privacy requests." />
            </div>
          </Section>

          <Section id="seo" icon="search" title="Search engines" lead="How the website appears in Google and when a link is shared on WhatsApp or social media.">
            <div className="grid gap-4">
              <Field label="Site title" name="seo_title" defaultValue={s.seo.title} hint="About 60 characters. Shown as the headline in search results." />
              <Field label="Description" name="seo_description" defaultValue={s.seo.description} textarea rows={3} hint="About 150 characters. Shown under the headline in search results." />
            </div>
          </Section>

          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)-2.0625rem)] z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-concrete/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8 lg:bottom-0 lg:mx-0 lg:rounded-2xl lg:border lg:px-5">
            <SubmitButton>Save settings</SubmitButton>
            <span className="text-sm text-ink-soft">Saves every section. A copy of the old settings is kept under History.</span>
          </div>
        </form>

        <section className="mt-6 rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
          <h2 className="heading text-lg">Refresh the website</h2>
          <p className="mb-4 mt-1 max-w-[70ch] text-sm text-ink-soft">
            The site refreshes itself whenever you save in this dashboard. If data was loaded straight into the database (for example a catalogue import by your IT team), use this to show it immediately.
          </p>
          <form action={refreshSiteCache}>
            <SubmitButton variant="outline" pendingText="Refreshing…">
              Refresh now
            </SubmitButton>
          </form>
        </section>
      </SectionedPage>
    </>
  );
}
