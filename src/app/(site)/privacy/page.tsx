import type { Metadata } from "next";
import { PageHead } from "@/components/site/PageHead";
import { formatDate } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy notice" };
export const dynamic = "force-dynamic";

// Written to the Nigeria Data Protection Act 2023 and GAID 2025. Have the company's DPO review it before launch.
export default async function Privacy() {
  const s = await getSettings();
  const who = s.privacy.controllerName || s.company.name;
  const dpo = s.privacy.dpoEmail;
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: "Home" }, { label: "Privacy notice" }]} title="Privacy notice" lead={`How ${who} handles the personal information you give us on this website.`}>
        <p className="mt-4 text-sm text-ink-soft">Last updated {formatDate(s.privacy.lastUpdated)}</p>
      </PageHead>
      <div className="wrap py-12">
        <div className="prose-site">
          <h2>Who we are</h2>
          <p>
            {who} is the data controller for this website. {s.company.heritage}{" "}
            {dpo ? (
              <>
                You can reach our Data Protection Officer{s.privacy.dpoName ? `, ${s.privacy.dpoName},` : ""} at <a href={`mailto:${dpo}`}>{dpo}</a>.
              </>
            ) : null}
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Enquiries and bookings:</strong> your name, email, phone, company, message, and machine details such as serial
              number, hour meter, site location and photos you choose to upload.
            </li>
            <li>
              <strong>Conversations with {s.enyo.name}:</strong> the messages you type into our website assistant, and any contact
              details you give it so that our team can follow up.
            </li>
            <li>
              <strong>Visit statistics (only if you accept):</strong> which pages were viewed, the referring site and device type,
              linked to a random identifier. We do not store your IP address.
            </li>
          </ul>

          <h2>Why we use it, and on what basis</h2>
          <ul>
            <li>To answer your enquiry, prepare quotes, schedule technicians and supply parts — necessary to take steps at your request before or under a contract.</li>
            <li>To keep a record of service requests and the advice we gave — our legitimate interest in running a reliable service.</li>
            <li>To understand how the website is used so we can improve it — your consent, which you can withdraw at any time from Cookie settings.</li>
          </ul>
          <p>We do not sell your information and we do not use it for advertising.</p>

          <h2>{s.enyo.name}, our website assistant</h2>
          <p>
            {s.enyo.name} is an automated AI assistant, not a person. It answers from information about our products and services
            and can pass your request to our team. Conversations are stored so staff can follow up and improve answers. Do not
            share sensitive personal information in the chat.
          </p>

          <h2>Who we share it with</h2>
          <p>
            Our staff who handle your request, and service providers that host the website, send our emails and power the
            assistant. Some of these providers process data outside Nigeria. Where they do, we rely on safeguards permitted by
            the Nigeria Data Protection Act, such as contractual protections. Where it is needed to support your machine, we may
            share relevant details with the equipment manufacturer.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Enquiries and service records are kept for as long as they are useful for supporting your equipment and meeting our
            legal obligations, and then deleted. Visit statistics are kept in aggregate.
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask to see, correct, delete or move your information, object to or restrict how we use it, and withdraw
            consent. {dpo ? <>Email <a href={`mailto:${dpo}`}>{dpo}</a>.</> : "Contact us using the details on our contact page."} You
            may also complain to the Nigeria Data Protection Commission.
          </p>

          <h2>Security</h2>
          <p>
            We use encrypted connections, access controls for staff, and keep a log of administrative actions. If a breach
            affects you, we will tell you and the Commission as the law requires.
          </p>
        </div>
      </div>
    </>
  );
}
