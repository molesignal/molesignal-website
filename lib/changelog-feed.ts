import { CHANGELOG } from "@/content/changelog";
import { getReleases } from "@/lib/github";
import { parseReleaseBody } from "@/lib/parse-release";

/**
 * Builds the RSS feed item list for /changelog/rss.xml (ISSUE-21 / T20).
 *
 * Extracted from the route handler so the feed-building logic and the page
 * data path can be tested against the SAME `getReleases()` source (AC2 — RSS
 * and page must be same-source, same-order). The output is byte-for-byte what
 * the route used to build inline; the route now only sorts + serializes.
 *
 *   - Primary source is the GitHub Releases API (ISR 1h via getReleases()).
 *   - When the API returns nothing, falls back to the curated static CHANGELOG
 *     so feed readers never see an empty feed (same fallback rule as the page).
 */
export type FeedItem = {
  version: string;
  title: string;
  date: string;
  description: string;
};

export async function collectChangelogFeedItems(): Promise<FeedItem[]> {
  const releases = await getReleases(30);
  if (releases.length > 0) {
    return releases.map((r) => {
      const { items } = parseReleaseBody(r.bodyMarkdown);
      const summary = items
        .map((it) => `${it.tag.toUpperCase()}: ${it.text}`)
        .join("\n");
      const titleSuffix = r.name && r.name !== r.tag ? ` — ${r.name}` : "";
      return {
        version: r.version,
        title: `v${r.version}${titleSuffix}`,
        date: r.publishedAt,
        description: summary || r.bodyMarkdown.trim(),
      };
    });
  }
  return CHANGELOG.map((entry) => ({
    version: entry.version,
    title: entry.title
      ? `v${entry.version} — ${entry.title}`
      : `v${entry.version}`,
    date: entry.date,
    description: entry.items
      .map((it) => `${it.tag.toUpperCase()}: ${it.text}`)
      .join("\n"),
  }));
}

/** Newest-first by publication date — the order both the page and feed render. */
export function sortFeedNewestFirst<T extends { date: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
