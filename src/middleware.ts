import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs on every page request:
 * 1. A per-request nonce and a strict Content Security Policy, so injected scripts can't run
 *    (Next.js adds the nonce to its own scripts automatically).
 * 2. A cheap gate for the dashboard: no session cookie means the login page. Pages still verify
 *    the session properly on the server.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin && pathname !== "/admin/login" && pathname !== "/admin/setup") {
    if (!req.cookies.get("cn_admin") && !req.cookies.get("__Host-cn_admin")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const dev = process.env.NODE_ENV !== "production";
  // Google Translate is loaded only when a visitor picks a language; its hosts are allowed here.
  const google = "https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.gstatic.com https://www.google.com";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' ${google}`,
    `img-src 'self' data: blob: ${google}`,
    "font-src 'self' data:",
    `connect-src 'self' ${google}${dev ? " ws:" : ""}`,
    // Manufacturer films play from YouTube's no-cookie player, only after the visitor presses play.
    `frame-src ${google} https://www.youtube-nocookie.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  if (isAdmin) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

export const config = {
  // Pages only: skip static files, images, the media route and API endpoints.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|media/|api/|brand/|images/|icon.svg|favicon.ico|robots.txt|sitemap.xml|\\.well-known).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
};
