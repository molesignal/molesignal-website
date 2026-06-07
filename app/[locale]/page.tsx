import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ArchitectureDiagram } from "@/components/architecture-diagram";
import { CommunityCallout } from "@/components/community-callout";
import { CompareTable } from "@/components/compare-table";
import { ContributorWall } from "@/components/contributor-wall";
import { CrossSignalDemo } from "@/components/cross-signal-demo";
import { GitHubStatsChip } from "@/components/github-stats-chip";
import { CodeBlock } from "@/components/ui/code-block";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { DOCKER_STANDALONE_CMD } from "@/lib/commands";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  return {
    title: `${t("title")} ${t("titleHighlight")}`,
    description: t("subtitle"),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tHero = await getTranslations("hero");
  const tCommon = await getTranslations("common");

  return (
    <>
      {/* Hero — left-aligned, brand-color highlight (no gradient), mono $ subtitle */}
      <Section padding="lg" tint="hero">
        <div className="max-w-4xl space-y-6">
          <Pill variant="marketing">{tHero("preReleasePill")}</Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter leading-[1.05]">
            {tHero("title")}{" "}
            <span className="text-primary">{tHero("titleHighlight")}</span>
          </h1>
          <p className="text-fg-muted max-w-2xl font-mono text-base">
            <span className="text-primary">$</span> {tHero("command")}
          </p>
          {/* Two parallel paths: self-host now (the real free action) + Cloud
              waitlist (the future SaaS). GitHub chip is the trust signal, not
              the subject. */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/start"
              data-analytics-event="cta_click"
              data-analytics-source-page
              data-analytics-props='{"label":"Self-host free","destination":"/start"}'
              className="bg-primary text-primary-foreground hover:bg-primary/90 duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-colors"
            >
              {tHero("ctaPrimary")} <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/cloud"
              data-analytics-event="cta_click"
              data-analytics-source-page
              data-analytics-props='{"label":"Cloud waitlist","destination":"/cloud"}'
              className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center gap-2 rounded-md border px-5 text-base font-strong transition-colors"
            >
              {tHero("ctaSecondary")}
            </Link>
            <GitHubStatsChip size="chip" className="h-11 px-4 text-sm" />
          </div>
          {/* Real command preview — signals "this is a real tool, not a pitch" */}
          <div className="max-w-2xl pt-1">
            <CodeBlock
              code={DOCKER_STANDALONE_CMD}
              language="bash"
              filename={t("startTerminalLabel")}
            />
          </div>
        </div>
      </Section>

      {/* Cross-signal demo */}
      <Section padding="md">
        <div className="mb-8 max-w-3xl space-y-3">
          <h2 className="text-display-lg font-display-strong tracking-tighter">
            {t("demoTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("demoBody")}</p>
        </div>
        <CrossSignalDemo />
        <div className="mt-4 flex justify-end">
          <Link
            href="/architecture#data-path"
            className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 text-sm font-strong transition-colors"
          >
            {t("demoCta")}
          </Link>
        </div>
      </Section>

      {/* Why teaser */}
      <Section padding="md" tint="surface">
        <div className="mb-8 max-w-3xl space-y-3">
          <h2 className="text-display-lg font-display-strong tracking-tighter">
            {t("whyTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("whyBody")}</p>
        </div>
        <CompareTable variant="slim" />
      </Section>

      {/* Architecture teaser */}
      <Section padding="md">
        <div className="mb-8 max-w-3xl space-y-3">
          <h2 className="text-display-lg font-display-strong tracking-tighter">
            {t("archTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("archBody")}</p>
        </div>
        <ArchitectureDiagram variant="slim" />
        <div className="mt-4 flex justify-end">
          <Link
            href="/architecture"
            className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 text-sm font-strong transition-colors"
          >
            {tCommon("readArchitecture")} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </Section>

      {/* Quick Start teaser — left-aligned with brand pill */}
      <Section padding="md" tint="surface">
        <div className="mb-8 max-w-3xl space-y-3">
          <Pill variant="brand">{t("startPill")}</Pill>
          <h2 className="text-display-lg font-display-strong tracking-tighter">
            {t("startTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("startBody")}</p>
        </div>
        <div className="space-y-4">
          <CodeBlock
            code={DOCKER_STANDALONE_CMD}
            language="bash"
            filename={t("startTerminalLabel")}
          />
          <div className="flex justify-end">
            <Link
              href="/start"
              className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 text-sm font-strong transition-colors"
            >
              {tCommon("fullGuide")} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* Live stats / building in the open */}
      <Section padding="md">
        <div className="mb-8 max-w-3xl space-y-3">
          <h2 className="text-display-lg font-display-strong tracking-tighter">
            {t("statsTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("statsBody")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
          <GitHubStatsChip size="large" />
          <ContributorWall size="compact" />
        </div>
        <div className="mt-8">
          <CommunityCallout />
        </div>
      </Section>

      {/* Design Partner CTA — left-border accent card (no glow / gradient) */}
      <Section padding="lg">
        <div className="bg-surface border-border rounded-xl border border-l-4 border-l-primary p-8 md:p-10">
          <div className="max-w-2xl space-y-6">
            <Pill variant="marketing">{t("designPartnerPill")}</Pill>
            <h2 className="text-display-xl font-display-strong tracking-tighter">
              {t("designPartnerHook")}
            </h2>
            <p className="text-fg-muted text-lg">{t("designPartnerBody")}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/design-partner"
                data-analytics-event="cta_click"
                data-analytics-source-page
                data-analytics-props='{"label":"Become a design partner","destination":"/design-partner"}'
                className="bg-primary text-primary-foreground hover:bg-primary/90 duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-colors"
              >
                {tCommon("becomeDesignPartner")}{" "}
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                href="/cloud"
                data-analytics-event="cta_click"
                data-analytics-source-page
                data-analytics-props='{"label":"Join the waitlist","destination":"/cloud"}'
                className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center gap-2 rounded-md border px-5 text-base font-strong transition-colors"
              >
                {tCommon("joinWaitlist")}
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
