import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  // A preview site stays out of search engines until it goes live on the real domain.
  if (process.env.PREVIEW_NOINDEX === "1") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/media/"] }], sitemap: `${base}/sitemap.xml` };
}
