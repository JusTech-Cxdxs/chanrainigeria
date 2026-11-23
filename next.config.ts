import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for Docker / any Node host. Vercel ignores this.
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  experimental: {
    serverActions: { bodySizeLimit: "14mb" },
  },
  // The old slider page now lives under Images.
  async redirects() {
    return [
      { source: "/admin/appearance", destination: "/admin/images", permanent: true },
      { source: "/book-service", destination: "/request-service", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
