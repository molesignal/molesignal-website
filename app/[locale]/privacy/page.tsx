import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";

const LAST_UPDATED = "2026-06-02";
const FOUNDERS_EMAIL = "founders@molesignal.io";

const emailLink = (chunks: React.ReactNode) => (
  <a
    href={`mailto:${FOUNDERS_EMAIL}`}
    className="text-primary underline-offset-2 hover:underline"
  >
    {chunks}
  </a>
);

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

  // `t()` only returns string leaves, so the structured `sections` array is
  // read from the full message bundle and navigated to directly.
  const messages = await getMessages();
  const sections = (messages.legal as { privacy: { sections: LegalSection[] } })
    .privacy.sections;

  return (
    <LegalDocument
      title={t("privacy.title")}
      lastUpdated={t("lastUpdated", { date: LAST_UPDATED })}
      disclaimer={t.rich("disclaimer", { email: emailLink })}
      intro={t("privacy.intro")}
      sections={sections}
      footer={t.rich("privacy.contact", { email: emailLink })}
    />
  );
}
