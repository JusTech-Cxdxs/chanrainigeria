import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site-url";
import { headers } from "next/headers";
import { getSettings, imageUrl, mediaUrl } from "@/lib/settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const base = siteUrl();
  const icon = mediaUrl(s.branding.faviconId) ?? "/brand/leaf.svg";
  return {
    metadataBase: new URL(base),
    title: { default: s.seo.title, template: `%s | ${s.company.shortName}` },
    description: s.seo.description,
    applicationName: s.company.shortName,
    openGraph: { siteName: s.company.name, type: "website", locale: "en_NG", images: [imageUrl(s, "og-image")] },
    twitter: { card: "summary_large_image" },
    icons: { icon, apple: icon },
    formatDetection: { telephone: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#06120a" },
  ],
};

// Applies the saved light/dark choice before paint so nothing flashes.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [s, h] = await Promise.all([getSettings(), headers()]);
  const nonce = h.get("x-nonce") ?? undefined;
  const vars = { "--brand": s.branding.primary, "--accent": s.branding.accent } as React.CSSProperties;
  return (
    <html lang="en-NG" style={vars} suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
