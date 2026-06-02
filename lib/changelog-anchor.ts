/**
 * Single source of truth for the changelog version anchor (ISSUE-21 / T20).
 *
 * The /changelog page entry `id`, the sidebar version-nav `href`, and the RSS
 * `<link>`/`<guid>` must all derive the SAME `#v…` fragment from a version, or
 * a feed-reader click lands on a dead anchor. Before this helper the rule was
 * hardcoded in three places (`components/changelog-entry.tsx`,
 * `app/[locale]/changelog/page.tsx`, `app/changelog/rss.xml/route.ts`) — any
 * drift between them silently broke jump-to-version. Centralizing it turns
 * "three places agree" from a test expectation into a compile-time guarantee.
 *
 * Rule: strip dots to dashes, keep the leading `v`. Pre-release tags survive
 * verbatim apart from the dot→dash swap:
 *   "0.7.0"        → "v0-7-0"
 *   "0.7.0-rc.1"   → "v0-7-0-rc-1"
 *
 * The helper returns only the bare anchor (`v0-7-0`); callers add the `#`
 * prefix themselves (`id={anchor}`, `href={`#${anchor}`}`).
 */
export function versionAnchor(version: string): string {
  return `v${version.replace(/\./g, "-")}`;
}
