import { defineRouting } from "next-intl/routing";

/**
 * Locale configuration.
 *
 * EN is the default and uses no prefix (`/why`, `/architecture`).
 * ZH is mirrored at `/zh/...` for the SEO-friendly Chinese version.
 *
 * Blog is intentionally EN-only in v1 (see DESIGN_BRIEF.md "Out of Scope").
 * The proxy + page-level checks redirect `/zh/blog/*` to `/blog/*` with a
 * friendly banner.
 */
export const routing = defineRouting({
  locales: ["en", "zh"],
  defaultLocale: "en",
  // EN at root (/), ZH prefixed (/zh/...). EN explicit prefix `/en/*` 301s
  // to root via the proxy.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
