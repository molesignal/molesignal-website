import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CompareTable } from "@/components/compare-table";
import { CostCalculator } from "@/components/cost-calculator";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "why" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const SCENARIO_IDS = [
  "3am",
  "budget",
  "es-ck",
  "multi-team",
  "realtime",
] as const;

export default async function WhyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("why");
  const tCommon = await getTranslations("common");

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Pill variant="marketing">{t("pill")}</Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-fg-muted text-lg">{t("lede")}</p>
        </div>
      </Section>

      <Section padding="md" id="paths">
        <h2 className="text-display-md font-display-strong mb-6 tracking-tighter">
          {t("pathsTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <PathCard tone="bad" title={t("saasTitle")} body={t("saasBody")} />
          <PathCard tone="bad" title={t("ossTitle")} body={t("ossBody")} />
          <PathCard
            tone="brand"
            title={t("moleTitle")}
            body={t("moleBody")}
          />
        </div>
      </Section>

      <Section padding="md" tint="surface" id="compare">
        <div className="mb-6 space-y-2">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("compareTitle")}
          </h2>
          <p className="text-fg-muted text-sm">{t("compareCaption")}</p>
        </div>
        <CompareTable variant="full" />
      </Section>

      <Section padding="md" id="cost">
        <div className="mb-6 max-w-3xl space-y-2">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("costTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("costBody")}</p>
        </div>
        <CostCalculator />
      </Section>

      <Section padding="md" tint="surface" id="scenarios">
        <h2 className="text-display-md font-display-strong mb-6 tracking-tighter">
          {t("scenariosTitle")}
        </h2>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SCENARIO_IDS.map((id, i) => (
            <li
              key={id}
              id={id}
              className="border-border bg-surface space-y-2 rounded-lg border p-5"
            >
              <div className="text-fg-muted font-mono text-xs tabular-nums">
                {String(i + 1).padStart(2, "0")} / 05
              </div>
              <h3 className="text-fg font-strong text-base">
                {t(`scenarios.${id}.title`)}
              </h3>
              <p className="text-fg-muted text-sm">
                {t(`scenarios.${id}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section padding="md" id="not">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("notTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("notBody")}</p>
        </div>
      </Section>

      <Section padding="md">
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/start"
            className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-shadow"
          >
            {tCommon("tryIt")} <ArrowRight size={16} aria-hidden />
          </Link>
          <Link
            href="/design-partner"
            className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center rounded-md border px-5 text-base font-strong transition-colors"
          >
            {tCommon("becomeDesignPartner")}
          </Link>
        </div>
      </Section>
    </>
  );
}

function PathCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "bad" | "brand";
}) {
  return (
    <article
      className={
        tone === "brand"
          ? "border-primary-muted bg-primary-bg rounded-lg border p-5 space-y-2"
          : "border-border bg-surface rounded-lg border p-5 space-y-2"
      }
    >
      <h3
        className={
          tone === "brand"
            ? "text-primary text-base font-strong"
            : "text-fg text-base font-strong"
        }
      >
        {title}
      </h3>
      <p className="text-fg-muted text-sm leading-relaxed">{body}</p>
    </article>
  );
}
