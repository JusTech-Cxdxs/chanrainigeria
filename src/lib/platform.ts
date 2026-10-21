/**
 * The platform behind the dashboard, from one place. Its brand appears only on the staff sign-in
 * page, the dashboard footer and the dashboard loader. Never on the public website or in any email.
 *
 * Every value can be overridden by an environment variable: PLATFORM_NAME, PLATFORM_DESCRIPTOR,
 * PLATFORM_POWERED_BY, PLATFORM_MAKER, PLATFORM_URL, PLATFORM_SUPPORT_EMAIL, PLATFORM_SUPPORT_PHONE.
 * The NEXT_PUBLIC_ forms work too and are fixed into the browser code at build time.
 * Safe to import in client components: the dashboard passes the server's values to the browser
 * (PlatformBridge), so both always show the same thing.
 */
export type PlatformInfo = {
  name: string;
  descriptor: string;
  poweredBy: string;
  maker: string;
  website: string;
  supportEmail: string;
  supportPhone: string;
};

const pick = (...v: (string | undefined)[]) => v.map((x) => x?.trim()).find((x) => x) ?? "";

const name = pick(process.env.PLATFORM_NAME, process.env.NEXT_PUBLIC_PLATFORM_NAME, "EJO 100");

export const PLATFORM: PlatformInfo = {
  name,
  descriptor: pick(process.env.PLATFORM_DESCRIPTOR, process.env.NEXT_PUBLIC_PLATFORM_DESCRIPTOR, "Enterprise Platform"),
  poweredBy: pick(process.env.PLATFORM_POWERED_BY, process.env.NEXT_PUBLIC_PLATFORM_POWERED_BY, `Powered by ${name}`),
  maker: pick(process.env.PLATFORM_MAKER, process.env.NEXT_PUBLIC_PLATFORM_MAKER, "Just Technologies (JusTech)"),
  website: safeUrl(pick(process.env.PLATFORM_URL, process.env.NEXT_PUBLIC_PLATFORM_URL, "https://justech-dev.vercel.app")),
  supportEmail: pick(process.env.PLATFORM_SUPPORT_EMAIL, process.env.NEXT_PUBLIC_PLATFORM_SUPPORT_EMAIL),
  supportPhone: pick(process.env.PLATFORM_SUPPORT_PHONE, process.env.NEXT_PUBLIC_PLATFORM_SUPPORT_PHONE),
};

function safeUrl(u: string) {
  return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : "https://justech-dev.vercel.app";
}

/** The words before the name in "Powered by EJO 100", for the two-line credit. */
export function poweredByLead(p: PlatformInfo) {
  const i = p.poweredBy.lastIndexOf(p.name);
  return (i > 0 ? p.poweredBy.slice(0, i) : "Powered by").trim();
}
