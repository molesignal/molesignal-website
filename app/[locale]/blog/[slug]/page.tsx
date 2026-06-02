import { Clock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { MdxBody } from "@/components/blog/mdx-body";
import { BlogPostCard } from "@/components/blog-post-card";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { BLOG_POSTS, getPostBySlug, getRelatedPosts } from "@/content/blog";
import { Link } from "@/i18n/navigation";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  // Blog is EN-only — ZH users get a friendly redirect notice (M4.15).
  // Dead-link guard (AC2): only deep-link to the EN post when the slug really
  // exists; otherwise fall back to the EN blog index so an unknown slug never
  // links to a 404.
  if (locale === "zh") {
    const exists = Boolean(getPostBySlug(slug));
    const href = exists ? `/blog/${slug}` : "/blog";
    const label = exists ? t("zhReadEnglishPost") : t("zhReadEnglish");
    return (
      <Section padding="lg">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <h1 className="text-display-md font-display-strong tracking-tighter">
            {t("zhUnavailable")}
          </h1>
          <p>
            <Link
              href={href}
              locale="en"
              className="text-primary hover:text-marketing-accent text-sm font-strong"
            >
              {label}
            </Link>
          </p>
        </div>
      </Section>
    );
  }

  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(slug, 3);

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Pill key={tag} variant="default">
                {tag}
              </Pill>
            ))}
          </div>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {post.title}
          </h1>
          <div className="text-fg-muted flex items-center gap-3 text-sm">
            <span className="text-fg font-strong">{post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.date} className="tabular-nums">
              {DATE_FMT.format(new Date(post.date))}
            </time>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden /> {post.readTimeMinutes} min
            </span>
          </div>
        </div>
      </Section>

      <Section padding="md">
        <article className="prose-container">
          <div className="text-fg text-base leading-relaxed">
            <MdxBody source={post.body} />
          </div>
        </article>
      </Section>

      {related.length > 0 && (
        <Section padding="md" tint="surface">
          <h2 className="text-display-md font-display-strong mb-6 tracking-tighter">
            {t("relatedTitle")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((p) => (
              <BlogPostCard key={p.slug} post={p} size="compact" />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
