import { Suspense } from "react";
import { NavProgress } from "@/components/ejo/NavProgress";
import { Analytics } from "@/components/site/Analytics";
import { BrandLoader } from "@/components/site/BrandLoader";
import { CookieBanner } from "@/components/site/CookieBanner";
import { Enyo } from "@/components/site/Enyo";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Reveal } from "@/components/site/Reveal";
import { SearchDialog } from "@/components/site/SearchDialog";
import { getBranches, getBrands, getCategories } from "@/lib/catalogue";
import { getSettings, mediaUrl } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [s, categories, branches, brands] = await Promise.all([getSettings(), getCategories(), getBranches(), getBrands()]);
  return (
    <>
      {/* Without JavaScript, nothing waits for the scroll animation. */}
      <noscript>
        <style>{".reveal{opacity:1!important;transform:none!important}.loader-veil{display:none}"}</style>
      </noscript>
      {s.branding.showLoader ? <BrandLoader logo={mediaUrl(s.branding.logoId)} name={s.company.shortName} /> : null}
      <Suspense>
        <NavProgress />
      </Suspense>
      <Header
        name={s.company.shortName}
        logoUrl={mediaUrl(s.branding.logoId)}
        logoDarkUrl={mediaUrl(s.branding.logoDarkId)}
        categories={categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name, families: c.families.map((f) => ({ id: f.id, slug: f.slug, name: f.name })) }))}
        languages={s.translate.languages}
        translate={s.translate.enabled}
      />
      <main id="main">{children}</main>
      <Footer settings={s} categories={categories} branches={branches} brands={brands.filter((b) => b.showOnHome)} />
      <SearchDialog />
      <Reveal />
      <CookieBanner />
      <Analytics />
      {s.enyo.enabled ? (
        <Enyo
          name={s.enyo.name}
          greeting={s.enyo.greeting}
          contact={{
            legalName: s.company.name,
            phone: s.contact.phone,
            whatsapp: s.contact.whatsapp,
            email: s.contact.email,
            address: s.contact.address,
            hours: s.contact.hours,
          }}
        />
      ) : null}
    </>
  );
}
