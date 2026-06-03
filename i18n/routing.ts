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
  // Always default to EN at `/`. Without this, next-intl reads the
  // `Accept-Language` header and silently 307s zh-* browsers to `/zh/...`,
  // which makes EN feel non-default. The explicit language switcher still
  // works.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
