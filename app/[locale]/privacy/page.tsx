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
  return { title: t("privacyTitle") };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  return <LegalStub title={t("privacyTitle")} body={t("stub")} lastUpdated={t("lastUpdated", { date: LAST_UPDATED })} />;
}

function LegalStub({
  title,
  body,
  lastUpdated,
}: {
  title: string;
  body: string;
  lastUpdated: string;
}) {
  return (
    <Section padding="lg">
      <div className="prose-container space-y-4">
        <h1 className="text-display-lg font-display-strong tracking-tighter">
          {title}
        </h1>
        <p className="text-fg-muted text-sm">{lastUpdated}</p>
        <p className="text-fg text-base">{body}</p>
      </div>
    </Section>
  );
}
