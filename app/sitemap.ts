import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/blog-source";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://molesignal.io";

const STATIC_PATHS = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/why", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/architecture", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/start", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/enterprise", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/security", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/stewardship", priority: 0.6, changeFrequency: "monthly" as const },
  {
    path: "/design-partner",
    priority: 0.8,
    changeFrequency: "monthly" as const,
  },
  { path: "/cloud", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/roadmap", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
];

/**
 * Build the sitemap with hreflang alternates between EN and ZH. Blog and
 * its detail pages are EN-only in v1 (Brief: out of scope for ZH), so
 * those entries skip the `alternates` block.
 *
 * Per next-intl `as-needed` policy, EN is at root and ZH is prefixed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — both locales with hreflang alternates
  for (const { path, priority, changeFrequency } of STATIC_PATHS) {
    entries.push({
      url: `${SITE}${path || "/"}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          en: `${SITE}${path || "/"}`,
          zh: `${SITE}/zh${path}`,
          "x-default": `${SITE}${path || "/"}`,
        },
      },
    });
    entries.push({
      url: `${SITE}/zh${path}`,
      lastModified: now,
      changeFrequency,
      priority: priority * 0.9,
      alternates: {
        languages: {
          en: `${SITE}${path || "/"}`,
          zh: `${SITE}/zh${path}`,
          "x-default": `${SITE}${path || "/"}`,
        },
      },
    });
  }

  // /blog index — EN-only in v1
  entries.push({
    url: `${SITE}/blog`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  });

  // Individual blog posts (EN only) — CMS + repo MDX merged
  for (const post of await getAllPosts()) {
    entries.push({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }

  return entries;
}
