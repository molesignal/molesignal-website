import type { BlogPostMeta } from "@/components/blog-post-card";

/**
 * Placeholder blog posts for v1 launch. Real MDX wiring lands in M4.11+
 * with frontmatter parsing; until then this static array drives both the
 * /blog index and /blog/[slug] detail pages.
 *
 * Post bodies use the `body` field below — Markdown lite. The index card
 * only reads `excerpt`; full pages render `body`.
 */

export type BlogPost = BlogPostMeta & {
  body: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-parquet-for-three-signals",
    title: "Why we put logs, metrics, and traces in the same Parquet store",
    excerpt:
      "The cost of having three signals live in three stores isn't query latency. It's the engineering you don't ship because the integration tax ate the quarter.",
    date: "2026-05-20",
    author: "molesignal team",
    readTimeMinutes: 9,
    tags: ["Architecture", "Storage"],
    body: `When we sketched the data plane, the easy answer was three stores: one for logs (column-oriented), one for metrics (TSDB), one for traces (graph-aware). Industry default. That's what the OSS stack does (Loki + Mimir + Tempo), and it's what most SaaS does under the hood.

But every cross-signal jump in that world is a join across three engines. trace_id → log line → host metric becomes three queries with three semantics. Schema evolves separately on each side. The thing your SRE actually needs at 3am — "show me everything for trace_id abc123 in this minute" — turns into copy-paste.

We tried the alternative: all three signals serialize to Parquet on object storage. Logs are wide, sparse rows. Metrics are narrow, dense rows. Traces are nested but flatten under Arrow lists. The columnar layout means prune-and-scan stays cheap even when 90% of the columns are empty.

The cost-of-correlation question becomes a planner question, not a serialization question. We get to write one query language (SQL) once, push down to DataFusion, and let the planner figure out which columns and which time windows to touch.

It's not free. The Parquet rotation under spiky ingest is harder than partition-tuning Loki. Cardinality limits on metrics are harder when they share a writer with logs. We're solving these in the open (see /roadmap).

But we'd rather solve fewer problems harder than five problems shallower.`,
  },
  {
    slug: "what-we-learned-from-100-incident-reviews",
    title: "What we learned reading 100 incident reviews",
    excerpt:
      "We read every public Datadog/Grafana/Splunk incident review we could find. The top finding wasn't query latency — it was context switching.",
    date: "2026-04-08",
    author: "molesignal team",
    readTimeMinutes: 7,
    tags: ["Research", "Community"],
    body: `Over the holidays we read 100 publicly written incident reviews — Cloudflare, GitHub, Shopify, Discord, smaller startups. The pattern that surprised us wasn't query latency. It was tab fatigue.

In 73 of 100 reviews, the responder mentioned switching between three or more dashboards or query interfaces during the active incident. In 41, they specifically called out "we lost time pasting trace IDs / timestamps" or equivalent.

This is the gap molesignal exists to close.

A few other findings, sorted by surprise:

- 18 reviews praised their tooling's UI explicitly. The rest either complained or didn't mention it.
- 9 reviews said the observability cost was a factor in choosing not to retain enough data to debug fully.
- 6 mentioned that bringing context to on-call was the most expensive part of being on-call.
- 0 reviews praised the alert evaluation latency. (Conspicuous silence.)

We're publishing the open list of links in /docs after v1.0. Until then, if you've read more than we have, come tell us at /design-partner.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(
  currentSlug: string,
  limit = 3,
): BlogPost[] {
  const current = getPostBySlug(currentSlug);
  if (!current) return [];
  const tags = new Set(current.tags);
  return BLOG_POSTS.filter((p) => p.slug !== currentSlug)
    .map((p) => ({ p, score: p.tags.filter((t) => tags.has(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}
