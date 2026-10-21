import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/NotFoundView";
import { siteContent } from "@/components/site/site-content";
import SiteLayout from "./(site)/layout";

export async function generateMetadata(): Promise<Metadata> {
  const c = await siteContent("not-found");
  return { title: c.t("title"), robots: { index: false } };
}

// Addresses that match no page at all. Wrapped in the public site's header and footer so it looks like the site.
export default function NotFound() {
  return (
    <SiteLayout>
      <NotFoundView />
    </SiteLayout>
  );
}
