/**
 * The site's public address, without a trailing slash. SITE_URL wins; on Vercel the production
 * domain (or the preview deployment's address) is used automatically.
 */
export function siteUrl() {
  const explicit = process.env.SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
