import type { Metadata } from "next";
import { CookieSettingsLink } from "@/components/site/CookieBanner";
import { PageHead } from "@/components/site/PageHead";

export const metadata: Metadata = { title: "Cookie notice" };
export const dynamic = "force-dynamic";

const rows = [
  ["cn_consent", "Cookie", "Essential", "Remembers your cookie choice", "6 months"],
  ["cn_vid", "Cookie", "Statistics (optional)", "Random ID to count visits without storing your IP address", "6 months"],
  ["cn_admin", "Cookie", "Essential (staff only)", "Keeps staff signed in to the dashboard", "12 hours"],
  ["theme", "Local storage", "Essential", "Remembers light or dark mode if you choose one", "Until cleared"],
  ["cn_loaded", "Session storage", "Essential", "Shows the logo animation only on your first page", "Until the tab closes"],
  ["cn_enyo", "Session storage", "Essential", "Keeps your assistant conversation while you browse", "Until the tab closes"],
];

export default function Cookies() {
  return (
    <>
      <PageHead
        crumbs={[{ href: "/", label: "Home" }, { label: "Cookie notice" }]}
        title="Cookie notice"
        lead="We keep cookies to a minimum. Optional statistics only run if you accept them, and there are no advertising or third-party tracking cookies."
      >
        <p className="mt-6">
          <span className="btn btn-outline">
            <CookieSettingsLink />
          </span>
        </p>
      </PageHead>
      <div className="wrap py-12">
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-[0.95rem]">
            <thead className="border-b border-line text-sm text-ink-soft">
              <tr>
                {["Name", "Type", "Purpose", "What it does", "How long"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]} className="border-b border-line-soft last:border-0">
                  {r.map((c, i) => (
                    <td key={i} className={`px-4 py-3 ${i === 0 ? "font-semibold" : ""}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
