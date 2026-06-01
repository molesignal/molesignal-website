import { getTranslations, setRequestLocale } from "next-intl/server";

import { Section } from "@/components/ui/section";

const LAST_UPDATED = "2026-05-29";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("termsTitle") };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  return (
    <Section padding="lg">
      <div className="prose-container space-y-4">
        <h1 className="text-display-lg font-display-strong tracking-tighter">
          {t("termsTitle")}
        </h1>
        <p className="text-fg-muted text-sm">
          {t("lastUpdated", { date: LAST_UPDATED })}
        </p>
        <p className="text-fg text-base">{t("stub")}</p>
      </div>
    </Section>
  );
}
