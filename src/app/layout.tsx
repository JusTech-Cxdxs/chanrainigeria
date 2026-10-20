import type { Metadata, Viewport } from "next";
import { getSettings, mediaUrl } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = process.env.SITE_URL || "http://localhost:3000";
  const icon = mediaUrl(s.branding.faviconId) ?? mediaUrl(s.branding.logoId);
  return {
    metadataBase: new URL(base),
    title: { default: s.seo.title, template: `%s | ${s.company.shortName}` },
    description: s.seo.description,
    applicationName: s.company.shortName,
    openGraph: { siteName: s.company.name, type: "website", locale: "en_NG" },
    icons: icon ? { icon } : undefined,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1ef" },
    { media: "(prefers-color-scheme: dark)", color: "#151d1a" },
  ],
};

// Applies the saved light/dark choice before paint so nothing flashes.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const vars = { "--brand": s.branding.primary, "--accent": s.branding.accent } as React.CSSProperties;
  return (
    <html lang="en-NG" style={vars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
