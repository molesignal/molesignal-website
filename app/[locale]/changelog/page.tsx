import { Rss } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChangelogEntry } from "@/components/changelog-entry";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { CHANGELOG } from "@/content/changelog";
import { versionAnchor } from "@/lib/changelog-anchor";
import { getReleases } from "@/lib/github";
import { releaseToChangelogMeta } from "@/lib/parse-release";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "changelog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

/**
 * Resolve changelog entries from GitHub Releases (ISR 1h). If GitHub
 * returns nothing — pre-1.0 with no published Releases yet, or rate-limit
 * during build — fall back to the curated `content/changelog.ts` so the
 * page is never empty. Both code paths render the same ChangelogEntry
 * component; the difference is purely the data source.
 */
async function getEntries() {
  const releases = await getReleases(30);
  if (releases.length === 0) {
    return {
      source: "fallback" as const,
      entries: CHANGELOG.map((meta) => ({
        meta,
        prose: "",
        htmlUrl: undefined as string | undefined,
        prerelease: false,
      })),
    };
  }
  return {
    source: "github" as const,
    entries: releases.map((r) => releaseToChangelogMeta(r)),
  };
}

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("changelog");

  const { source, entries } = await getEntries();

  const versionsSorted = [...entries].sort(
    (a, b) => +new Date(b.meta.date) - +new Date(a.meta.date),
  );

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Pill variant={source === "github" ? "brand" : "default"}>
            {source === "github" ? t("sourceLive") : t("sourceFallback")}
          </Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-fg-muted text-lg">{t("lede")}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href="/changelog/rss.xml"
              data-analytics-event="rss_subscribe"
              className="border-border text-fg-muted hover:text-fg hover:bg-bg-hover duration-fast inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-strong transition-colors"
            >
              <Rss size={12} aria-hidden /> {t("rss")}
            </a>
          </div>
        </div>
      </Section>

      <Section padding="md">
        {versionsSorted.length === 0 ? (
          <div className="mx-auto max-w-xl space-y-2 text-center">
            <h2 className="text-display-md font-display-strong">
              {t("noReleasesTitle")}
            </h2>
            <p className="text-fg-muted">{t("noReleasesBody")}</p>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[1fr_220px]">
            <article className="space-y-section-md min-w-0">
              {versionsSorted.map(({ meta, prose, htmlUrl, prerelease }) => (
                <ChangelogEntry
                  key={meta.version + meta.date}
                  entry={meta}
                  htmlUrl={htmlUrl}
                  prerelease={prerelease}
                >
                  {prose && (
                    <pre className="bg-bg-2 border-border mt-2 max-w-prose overflow-x-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap text-fg-muted">
                      {prose}
                    </pre>
                  )}
                </ChangelogEntry>
              ))}
            </article>
            <nav
              aria-label="Versions"
              className="sticky top-[calc(var(--nav-h)+var(--banner-h))] hidden self-start lg:block"
            >
              <p className="text-fg-muted mb-3 text-xs font-strong uppercase tracking-wide">
                {t("versionsLabel")}
              </p>
              <ul className="space-y-1.5 text-sm">
                {versionsSorted.map(({ meta }) => (
                  <li key={meta.version + meta.date}>
                    <a
                      href={`#${versionAnchor(meta.version)}`}
                      className="text-fg-muted hover:text-fg duration-fast transition-colors font-mono"
                    >
                      v{meta.version}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </Section>

      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("subscribeTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("subscribeBody")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/cloud"
              data-analytics-event="cta_click"
              data-analytics-source-page
              data-analytics-props='{"label":"Get the digest","destination":"/cloud"}'
              className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-strong transition-shadow"
            >
              {t("getDigest")}
            </Link>
            <a
              href="/changelog/rss.xml"
              data-analytics-event="rss_subscribe"
              className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-strong transition-colors"
            >
              <Rss size={12} aria-hidden /> RSS
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
