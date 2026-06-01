import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import type { BlogPostMeta } from "@/components/blog-post-card";

/**
 * Blog content source. Posts live as `content/blog/<slug>.mdx` files whose
 * frontmatter carries the `BlogPostMeta` fields and whose body is the article
 * text. Operations can add/edit posts by touching `.mdx` files alone — no code
 * change, no redeploy of component logic.
 *
 * The exported contract is intentionally unchanged from the previous hardcoded
 * version (`BLOG_POSTS` / `getPostBySlug` / `getRelatedPosts`, all synchronous)
 * so the index, detail, sitemap and OG-image consumers keep working untouched.
 *
 * Read is synchronous + module-level on purpose: `generateStaticParams()` and
 * `sitemap()` consume `BLOG_POSTS` synchronously. This file is server-only
 * (all four consumers are RSC/server), so `node:fs` is safe.
 */

export type BlogPost = BlogPostMeta & {
  body: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function loadPosts(): BlogPost[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const meta = data as BlogPostMeta;
    return {
      slug: meta.slug,
      title: meta.title,
      excerpt: meta.excerpt,
      date: meta.date,
      author: meta.author,
      readTimeMinutes: meta.readTimeMinutes,
      tags: meta.tags,
      coverUrl: meta.coverUrl,
      body: content.trim(),
    } satisfies BlogPost;
  });

  // `readdirSync` order is not guaranteed; sort newest-first for a stable
  // index ordering and featured-post selection.
  return posts.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
}

export const BLOG_POSTS: BlogPost[] = loadPosts();

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
