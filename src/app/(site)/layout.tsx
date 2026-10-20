import { Analytics } from "@/components/site/Analytics";
import { BrandLoader } from "@/components/site/BrandLoader";
import { CookieBanner } from "@/components/site/CookieBanner";
import { Enyo } from "@/components/site/Enyo";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getBranches, getCategories } from "@/lib/catalogue";
import { getSettings, mediaUrl } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, branches] = await Promise.all([getSettings(), getCategories(), getBranches()]);
  const enyoOn = settings.enyo.enabled;
  return (
    <>
      {settings.branding.showLoader ? (
        <BrandLoader logo={mediaUrl(settings.branding.logoId)} name={settings.company.shortName} />
      ) : null}
      <Header settings={settings} categories={categories} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} branches={branches} />
      <CookieBanner />
      <Analytics />
      {enyoOn ? <Enyo name={settings.enyo.name} greeting={settings.enyo.greeting} /> : null}
    </>
  );
}
