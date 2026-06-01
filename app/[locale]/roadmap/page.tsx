import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RoadmapList } from "@/components/roadmap-list";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
// Reads `common.openIssue` and `common.applyDesignPartner` for footer CTAs.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "roadmap" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("roadmap");
  const tCommon = await getTranslations("common");

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Pill variant="brand">{t("pill")}</Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-fg-muted text-lg">{t("lede")}</p>
        </div>
      </Section>

      <Section padding="md">
        <RoadmapList />
      </Section>

      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("influenceTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("influenceBody")}</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="https://github.com/molesignal/molesignal/issues"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 font-strong transition-colors"
            >
              {tCommon("openIssue")} <ArrowUpRight size={10} aria-hidden />
            </a>
            <Link
              href="/design-partner"
              className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 font-strong transition-colors"
            >
              {tCommon("applyDesignPartner")} <ArrowRight size={12} aria-hidden />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
