import { fill } from "@/components/site/fill";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { formatDate } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";

export const generateMetadata = () => pageMetadata("privacy");
export const dynamic = "force-dynamic";

/** Keeps names and addresses from settings from being read as Markdown. */
const plain = (s: string) => s.replace(/([\\`*_[\]<>])/g, "\\$1");

// Written to the Nigeria Data Protection Act 2023 and GAID 2025. Have the company's DPO review it before launch.
// The wording is editable under Pages and text → Privacy notice; the details below come from Company settings.
export default async function Privacy() {
  const [c, nav] = await Promise.all([siteContent("privacy"), siteContent("header")]);
  const s = c.settings;
  const who = s.privacy.controllerName || s.company.name;
  const dpo = s.privacy.dpoEmail;
  const email = dpo ? `[${plain(dpo)}](mailto:${dpo})` : "";
  const vars = {
    controller: plain(who),
    heritage: plain(s.company.heritage),
    enyo: plain(s.enyo.name),
    dpo: dpo ? c.f(s.privacy.dpoName ? "dpoWithName" : "dpoNoName", { name: plain(s.privacy.dpoName), email }) : "",
    rights: dpo ? c.f("rightsEmail", { email }) : c.t("rightsNoEmail"),
  };
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.f("lead", { controller: who })}>
        <p className="mt-4 text-sm text-white/75">{c.f("updated", { date: formatDate(s.privacy.lastUpdated) })}</p>
      </PageHead>
      <div className="wrap py-12">
        <div className="prose-site" dangerouslySetInnerHTML={{ __html: renderMarkdown(fill(c.t("body"), vars)) }} />
      </div>
    </>
  );
}
