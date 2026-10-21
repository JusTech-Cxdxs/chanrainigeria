import { refreshSiteCache, saveSettings } from "@/app/admin/actions/settings";
import { AdminHead, Check, Field, Flash, Panel, SubmitButton } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { enyoAiConfigured } from "@/lib/enyo";
import { mailConfigured } from "@/lib/mail";
import { getSettings, mediaUrl } from "@/lib/settings";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin("settings");
  const sp = await searchParams;
  const s = await getSettings();

  const LogoInput = ({ k, label, hint }: { k: "logoId" | "logoDarkId" | "faviconId"; label: string; hint: string }) => (
    <div className="field">
      <span>{label}</span>
      {s.branding[k] ? (
        <div className="flex items-center gap-4 rounded border border-line bg-concrete p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl(s.branding[k])!} alt="" className="h-10 w-auto" />
          <Check label="Remove" name={`remove_${k}`} />
        </div>
      ) : null}
      <input type="file" name={k} accept="image/*" className="input py-2" />
      <small>{hint}</small>
    </div>
  );

  return (
    <>
      <AdminHead title="Settings" lead="Everything about the company that the website, emails and Enyo use. Nothing is fixed in the code." />
      {sp.welcome ? (
        <p className="mb-6 rounded-md border-l-4 border-brand bg-surface px-4 py-3">
          Welcome. Start with the company details, desk contacts and logo, then save. You can come back any time.
        </p>
      ) : null}
      <Flash sp={sp} />

      <form action={saveSettings} className="grid gap-6">
        <Panel title="Company">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registered name" name="company_name" defaultValue={s.company.name} required />
            <Field label="Short name" name="company_shortName" defaultValue={s.company.shortName} hint="Used in the header, emails and page titles." />
            <Field label="Tagline" name="company_tagline" defaultValue={s.company.tagline} className="sm:col-span-2" />
            <Field label="About the company" name="company_about" defaultValue={s.company.about} textarea rows={5} className="sm:col-span-2" hint="Shown on the About page. Leave a blank line between paragraphs." />
            <Field label="Group name" name="company_groupName" defaultValue={s.company.groupName} />
            <Field label="Group website" name="company_groupUrl" defaultValue={s.company.groupUrl} type="url" />
            <Field label="Heritage line" name="company_heritage" defaultValue={s.company.heritage} className="sm:col-span-2" />
            <Field label="Group line" name="company_groupLine" defaultValue={s.company.groupLine} className="sm:col-span-2" hint="Shown on the home page slider and in the footer, e.g. A business of the Kewalram Chanrai Group." />
          </div>
        </Panel>

        <Panel title="Desks">
          <p className="-mt-2 mb-4 text-sm text-ink-soft">
            Each enquiry goes to one desk by email. Quotes go to the product line&apos;s desk, service bookings to Field service, parts requests to Parts, and everything for CNG to the CNG desk. Desks with no contact details are hidden on the site.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(s.desks).map(([k, d]) => (
              <fieldset key={k} className="grid gap-3 rounded-md border border-line-soft p-4">
                <legend className="px-1 font-semibold">{d.label}</legend>
                <Field label="Name shown" name={`desk_${k}_label`} defaultValue={d.label} />
                <Field label="Email (receives enquiries)" name={`desk_${k}_email`} type="email" defaultValue={d.email} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Phone" name={`desk_${k}_phone`} defaultValue={d.phone} />
                  <Field label="WhatsApp" name={`desk_${k}_whatsapp`} defaultValue={d.whatsapp} />
                </div>
              </fieldset>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Main email (fallback for desks without one)" name="contact_email" type="email" defaultValue={s.contact.email} />
            <Field label="Main phone" name="contact_phone" defaultValue={s.contact.phone} />
            <Field label="Main WhatsApp" name="contact_whatsapp" defaultValue={s.contact.whatsapp} />
            <Field label="Opening hours" name="contact_hours" defaultValue={s.contact.hours} />
            <Field label="Address" name="contact_address" defaultValue={s.contact.address} className="sm:col-span-2" hint="Shown in the footer, in Enyo's Contact us card and in every email." />
          </div>
        </Panel>

        <Panel title="Look and feel">
          <div className="grid gap-5 sm:grid-cols-2">
            <LogoInput k="logoId" label="Logo" hint="PNG or SVG with a transparent background, at least 400 px wide." />
            <LogoInput k="logoDarkId" label="Logo for dark mode (optional)" hint="A white or light version. Without it, the main logo is used." />
            <LogoInput k="faviconId" label="Browser tab icon (optional)" hint="Square PNG or SVG. Without it, the logo is used." />
            <div className="grid gap-4">
              <label className="field">
                <span>Brand colour</span>
                <input type="color" name="branding_primary" defaultValue={s.branding.primary} className="input h-12 cursor-pointer p-1" />
                <small>Buttons, links and drawings. Must be dark enough for white text.</small>
              </label>
              <label className="field">
                <span>Highlight colour</span>
                <input type="color" name="branding_accent" defaultValue={s.branding.accent} className="input h-12 cursor-pointer p-1" />
                <small>Used sparingly for urgent things like “machine down”.</small>
              </label>
              <Check label="Show the logo animation on first visit" name="branding_showLoader" defaultChecked={s.branding.showLoader} />
            </div>
          </div>
        </Panel>

        <Panel title="Home page" aside={<a href="/admin/appearance" className="text-sm font-semibold text-brand">Edit the slider and pictures</a>}>
          <div className="grid gap-4">
            <Check label="Show testimonials on the home page" name="home_showTestimonials" defaultChecked={s.home.showTestimonials} />
            <Field label="Field service headline" name="home_fieldServiceTitle" defaultValue={s.home.fieldServiceTitle} />
            <Field label="Field service text" name="home_fieldServiceText" defaultValue={s.home.fieldServiceText} textarea rows={3} />
          </div>
        </Panel>

        <Panel title="Search engines and sharing">
          <div className="grid gap-4">
            <Field label="Site title" name="seo_title" defaultValue={s.seo.title} />
            <Field label="Description" name="seo_description" defaultValue={s.seo.description} textarea rows={2} hint="About 150 characters." />
          </div>
        </Panel>

        <Panel title="Email" aside={<span className={`text-sm ${mailConfigured() ? "text-brand" : "text-danger"}`}>{mailConfigured() ? "Mail server connected" : "Mail server not connected"}</span>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sender name" name="email_fromName" defaultValue={s.email.fromName} />
            <Field label="Sender address" name="email_fromAddress" type="email" defaultValue={s.email.fromAddress} hint="Must be an address your mail server is allowed to send from." />
            <Field label="Default reply-to" name="email_replyTo" type="email" defaultValue={s.email.replyTo} />
            <Field label="Footer line" name="email_footerNote" defaultValue={s.email.footerNote} />
          </div>
        </Panel>

        <Panel title="Enyo assistant" aside={<span className={`text-sm ${enyoAiConfigured() ? "text-brand" : "text-ink-soft"}`}>{enyoAiConfigured() ? "AI connected" : "Basic mode (no AI key)"}</span>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Check label="Show Enyo on the website" name="enyo_enabled" defaultChecked={s.enyo.enabled} />
            <span />
            <Field label="Name" name="enyo_name" defaultValue={s.enyo.name} />
            <Field label="AI model" name="enyo_model" defaultValue={s.enyo.model} hint="From your AI provider, e.g. llama-3.3-70b-versatile on Groq." />
            <Field label="Greeting" name="enyo_greeting" defaultValue={s.enyo.greeting} textarea rows={2} className="sm:col-span-2" />
            <Field label="Tone" name="enyo_tone" defaultValue={s.enyo.tone} className="sm:col-span-2" />
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
        </Panel>

        <Panel title="Enquiry reminders">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Overdue after (hours)"
              name="enquiries_overdueHours"
              type="number"
              defaultValue={s.enquiries.overdueHours}
              hint="An open enquiry with no progress after this long is marked overdue. Machines-down are always flagged."
            />
            <Check
              label="Email each desk a daily list of overdue enquiries"
              name="enquiries_sendDailyReminder"
              defaultChecked={s.enquiries.sendDailyReminder}
              hint="Sent once a day at 8:00 Lagos time to each desk's email address."
            />
          </div>
        </Panel>

        <Panel title="Languages">
          <Check label="Offer the website in other languages" name="translate_enabled" defaultChecked={s.translate.enabled} hint="Uses Google Translate, loaded only when a visitor picks a language." />
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {[
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
            ].map(([code, label]) => (
              <label key={code} className="flex items-center gap-2">
                <input type="checkbox" name="translate_languages" value={code} defaultChecked={s.translate.languages.includes(code)} className="h-4 w-4 accent-[var(--brand)]" />
                {label}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="Privacy">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data controller" name="privacy_controllerName" defaultValue={s.privacy.controllerName} />
            <Field label="Privacy notice last updated" name="privacy_lastUpdated" type="date" defaultValue={s.privacy.lastUpdated} />
            <Field label="Data Protection Officer" name="privacy_dpoName" defaultValue={s.privacy.dpoName} />
            <Field label="DPO email" name="privacy_dpoEmail" type="email" defaultValue={s.privacy.dpoEmail} />
          </div>
        </Panel>

        <Panel title="Social media">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["linkedin", "facebook", "instagram", "x", "youtube"] as const).map((k) => (
              <Field key={k} label={k === "x" ? "X" : k === "linkedin" ? "LinkedIn" : k === "youtube" ? "YouTube" : k[0].toUpperCase() + k.slice(1)} name={`social_${k}`} type="url" defaultValue={s.social[k]} />
            ))}
          </div>
        </Panel>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-concrete/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <SubmitButton>Save settings</SubmitButton>
        </div>
      </form>

      <Panel title="Refresh the website" className="mt-6">
        <p className="mb-4 text-ink-soft">
          The site refreshes itself whenever you save in this dashboard. If data was loaded straight into the database (for example a catalogue import by your IT team), use this to show it immediately.
        </p>
        <form action={refreshSiteCache}>
          <SubmitButton variant="outline" pendingText="Refreshing…">
            Refresh now
          </SubmitButton>
        </form>
      </Panel>
    </>
  );
}
