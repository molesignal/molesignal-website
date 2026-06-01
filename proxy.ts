import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Next.js 16+ renamed the `middleware.ts` convention to `proxy.ts`. The next-intl
 * helper is name-agnostic — it returns a request handler that works as either.
 *
 * Locale routing rules (see .design/molesignal-website/INFORMATION_ARCHITECTURE.md §8):
 *   - `/`           → EN (default, no prefix)
 *   - `/zh/...`     → ZH
 *   - `/en/...`     → 301 → `/...`  (handled by next-intl with `localePrefix: as-needed`)
 *   - `/zh/blog/*`  → friendly 404 redirect handled at page level (M4.15)
 */
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  // - API routes (we handle locale-agnostic JSON elsewhere)
  // - Next internals (_next, _vercel)
  // - Root-level metadata routes that are *dotless* (so the `.*\..*` rule below
  //   misses them): the site-wide `/opengraph-image`. Without this exclusion the
  //   next-intl middleware swallows it into locale routing → 404 (the locale-
  //   scoped `/[locale]/blog/[slug]/opengraph-image` is unaffected — it doesn't
  //   start with `opengraph-image`).
  // - Static files at root (favicon.svg, robots.txt, sitemap.xml, etc. — any path with a dot)
  matcher: ["/((?!api|_next|_vercel|opengraph-image|.*\\..*).*)"],
};
