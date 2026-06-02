import { getTranslations, setRequestLocale } from "next-intl/server";

import { BlogPostCard } from "@/components/blog-post-card";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { BLOG_POSTS } from "@/content/blog";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  // Blog is EN-only in v1 — if someone landed on /zh/blog, render a friendly notice.
  if (locale === "zh") {
    return (
      <Section padding="lg">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <h1 className="text-display-md font-display-strong tracking-tighter">
            {t("zhUnavailable")}
          </h1>
          <p>
            <Link
              href="/blog"
              locale="en"
              className="text-primary hover:text-marketing-accent text-sm font-strong"
            >
              {t("zhReadEnglish")}
            </Link>
          </p>
        </div>
      </Section>
    );
  }

  const sorted = [...BLOG_POSTS].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );
  const [featured, ...rest] = sorted;

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Pill variant="default">Blog</Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-fg-muted text-lg">{t("lede")}</p>
        </div>
      </Section>

      <Section padding="md">
        {sorted.length === 0 ? (
          <div className="mx-auto max-w-xl space-y-2 text-center">
            <h2 className="text-display-md font-display-strong">
              {t("noPostsTitle")}
            </h2>
            <p className="text-fg-muted">{t("noPostsBody")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {featured && (
              <BlogPostCard post={featured} size="featured" />
            )}
            {rest.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </Section>
    </>
  );
}
