import { CHANGELOG } from "@/content/changelog";
import { getReleases } from "@/lib/github";
import { parseReleaseBody } from "@/lib/parse-release";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://molesignal.io";

/**
 * Atom-friendly RSS 2.0 feed for /changelog. The feed mirrors what the
 * /changelog page renders:
 *   - Primary source is the GitHub Releases API (ISR 1h via getReleases())
 *   - When the API returns nothing, falls back to the curated static
 *     CHANGELOG so feed readers don't see an empty feed.
 *
 * Items use the version anchor (`#vMAJOR-MINOR-PATCH`) on the changelog
 * page as their guid + link. Each release body is parsed into the same
 * `feat: …` / `fix: …` lines as the page, so feed previews look right.
 */
function xmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 3600; // 1h, matches getReleases() ISR window

type FeedItem = {
  version: string;
  title: string;
  date: string;
  description: string;
};

async function collectItems(): Promise<FeedItem[]> {
  const releases = await getReleases(30);
  if (releases.length > 0) {
    return releases.map((r) => {
      const { items } = parseReleaseBody(r.bodyMarkdown);
      const summary = items
        .map((it) => `${it.tag.toUpperCase()}: ${it.text}`)
        .join("\n");
      const titleSuffix =
        r.name && r.name !== r.tag ? ` — ${r.name}` : "";
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

export async function GET() {
  const feed = await collectItems();
  feed.sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const itemsXml = feed
    .map((item) => {
      const anchor = `v${item.version.replace(/\./g, "-")}`;
      const url = `${SITE}/changelog#${anchor}`;
      return `<item>
  <title>${xmlEscape(item.title)}</title>
  <link>${url}</link>
  <guid isPermaLink="false">${anchor}</guid>
  <pubDate>${new Date(item.date).toUTCString()}</pubDate>
  <description><![CDATA[${item.description}]]></description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>molesignal changelog</title>
  <link>${SITE}/changelog</link>
  <atom:link href="${SITE}/changelog/rss.xml" rel="self" type="application/rss+xml" />
  <description>Releases and changes for molesignal — self-hosted observability.</description>
  <language>en</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
}
