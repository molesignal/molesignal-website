import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";

const LAST_UPDATED = "2026-06-02";
const APACHE_LICENSE_URL = "https://www.apache.org/licenses/LICENSE-2.0";

const licenseLink = (chunks: React.ReactNode) => (
  <a
    href={APACHE_LICENSE_URL}
    target="_blank"
    rel="noopener noreferrer"
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

  // `t()` only returns string leaves, so the structured `sections` array is
  // read from the full message bundle and navigated to directly.
  const messages = await getMessages();
  const sections = (messages.legal as { terms: { sections: LegalSection[] } })
    .terms.sections;

  return (
    <LegalDocument
      title={t("terms.title")}
      lastUpdated={t("lastUpdated", { date: LAST_UPDATED })}
      disclaimer={t.rich("disclaimer", {
        email: (chunks) => (
          <a
            href="mailto:founders@molesignal.io"
            className="text-primary underline-offset-2 hover:underline"
          >
            {chunks}
          </a>
        ),
      })}
      intro={t("terms.intro")}
      sections={sections}
      footer={t.rich("terms.license", { license: licenseLink })}
    />
  );
}
