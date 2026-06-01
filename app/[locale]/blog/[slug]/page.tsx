import { Clock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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

  // Blog is EN-only — ZH users get a friendly redirect notice (M4.15)
  if (locale === "zh") {
    return (
      <Section padding="lg">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <h1 className="text-display-md font-display-strong tracking-tighter">
            {t("zhUnavailable")}
          </h1>
          <p>
            <Link
              href={`/blog/${slug}`}
              locale="en"
              className="text-primary hover:text-marketing-accent text-sm font-strong"
            >
              /blog/{slug} →
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
          <div className="text-fg space-y-4 text-base leading-relaxed">
            {post.body.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
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
