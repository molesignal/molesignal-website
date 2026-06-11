import { BLOG_POSTS, getPostBySlug, type BlogPost } from "@/content/blog";
import { getCmsPostBySlug, getCmsPosts, type CmsPost } from "@/lib/cms";

/**
 * Unified blog source: CMS posts (Payload) merged with repo MDX posts.
 * CMS wins on slug collisions, so a post can be migrated into the CMS
 * without touching the repo. With no CMS configured this degrades to
 * exactly the previous MDX-only behaviour.
 */

export type SitePost = BlogPost | CmsPost;

export const isCmsPost = (post: SitePost): post is CmsPost =>
  "bodyHtml" in post;

export async function getAllPosts(): Promise<SitePost[]> {
  const cms = await getCmsPosts();
  const cmsSlugs = new Set(cms.map((p) => p.slug));
  return [...cms, ...BLOG_POSTS.filter((p) => !cmsSlugs.has(p.slug))].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );
}

export async function getPost(slug: string): Promise<SitePost | undefined> {
  return (await getCmsPostBySlug(slug)) ?? getPostBySlug(slug);
}

/** Same tag-overlap ranking as content/blog's getRelatedPosts, across both sources. */
export async function getRelated(slug: string, limit = 3): Promise<SitePost[]> {
  const all = await getAllPosts();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const tags = new Set(current.tags);
  return all
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: p.tags.filter((t) => tags.has(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}
