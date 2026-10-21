import { CookieSettingsLink } from "@/components/site/CookieBanner";
import { PageHead } from "@/components/site/PageHead";
import { pageMetadata, siteContent } from "@/components/site/site-content";
import { renderMarkdown } from "@/lib/markdown";

export const generateMetadata = () => pageMetadata("cookies");
export const dynamic = "force-dynamic";

export default async function Cookies() {
  const [c, nav] = await Promise.all([siteContent("cookies"), siteContent("header")]);
  const cols = [c.t("colName"), c.t("colType"), c.t("colPurpose"), c.t("colWhat"), c.t("colHow")];
  const rows = c.list("rows");
  const body = c.t("body");
  return (
    <>
      <PageHead crumbs={[{ href: "/", label: nav.t("crumbHome") }, { label: c.t("crumb") }]} title={c.t("title")} lead={c.t("lead")}>
        <p className="mt-6">
          <CookieSettingsLink label={c.t("settingsButton")} className="btn btn-glass" />
        </p>
      </PageHead>
      <div className="wrap py-12">
        <div className="overflow-x-auto rounded-[18px] border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-[0.95rem]">
            <thead className="border-b border-line bg-concrete/60 text-sm text-ink-soft">
              <tr>
                {cols.map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.name}-${i}`} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    <code className="text-[0.9rem]">{r.name}</code>
                  </td>
                  <td className="px-4 py-3">{r.type}</td>
                  <td className="px-4 py-3">{r.purpose}</td>
                  <td className="px-4 py-3">{r.what}</td>
                  <td className="px-4 py-3">{r.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {body ? <div className="prose-site mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(body) }} /> : null}
      </div>
    </>
  );
}
