import { Clock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CmsBody } from "@/components/blog/cms-body";
import { MdxBody } from "@/components/blog/mdx-body";
import { BlogPostCard } from "@/components/blog-post-card";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { BLOG_POSTS } from "@/content/blog";
import { Link } from "@/i18n/navigation";
import { getPost, getRelated, isCmsPost } from "@/lib/blog-source";

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// ISR: repo MDX slugs are prerendered below; CMS-only slugs render on demand
// (dynamicParams default) and revalidate on the same cadence as the index.
// Literal on purpose — keep in sync with CMS_REVALIDATE_SECONDS in lib/cms.ts.
export const revalidate = 300;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
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
  // exists (in either source); otherwise fall back to the EN blog index so an
  // unknown slug never links to a 404.
  if (locale === "zh") {
    const exists = Boolean(await getPost(slug));
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
              className="text-primary hover:text-marketing-accent font-strong text-sm"
            >
              {label}
            </Link>
          </p>
        </div>
      </Section>
    );
  }

  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelated(slug, 3);

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
          <h1 className="text-display-lg md:text-display-xl font-display-strong tracking-tighter text-balance">
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

      {/* Header + body share one centered max-w-3xl column so their left edges
          align — no width mismatch between the title block and the prose. */}
      <Section padding="md">
        <article className="mx-auto max-w-3xl">
          {isCmsPost(post) ? (
            <CmsBody html={post.bodyHtml} />
          ) : (
            <MdxBody source={post.body} />
          )}
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
