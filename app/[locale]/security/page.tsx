import { ArrowUpRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";

const COMPLIANCE_KEYS = ["soc2", "hipaa", "gdpr"] as const;

const ADVISORY_URL =
  "https://github.com/molesignal/molesignal/security/advisories/new";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "security" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("security");

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Pill variant="default">{t("pill")}</Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-fg-muted text-lg">{t("lede")}</p>
        </div>
      </Section>

      {/* Responsible disclosure — real channels */}
      <Section padding="md">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("disclosureTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("disclosureBody")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:security@molesignal.io"
              className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-shadow"
            >
              {t("disclosureEmail")}
            </a>
            <a
              href={ADVISORY_URL}
              target="_blank"
              rel="noreferrer"
              className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center gap-1.5 rounded-md border px-5 text-base font-strong transition-colors"
            >
              {t("disclosureAdvisory")} <ArrowUpRight size={14} aria-hidden />
            </a>
            <a
              href="/.well-known/security.txt"
              className="text-primary hover:text-marketing-accent duration-fast text-sm font-strong transition-colors"
            >
              {t("disclosurePolicy")}
            </a>
          </div>
        </div>
      </Section>

      {/* Open by default + Your data */}
      <Section padding="md" tint="surface">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="border-border bg-bg-0 space-y-2 rounded-lg border p-6">
            <h3 className="text-fg font-strong text-base">{t("openTitle")}</h3>
            <p className="text-fg-muted text-sm">{t("openBody")}</p>
          </article>
          <article className="border-border bg-bg-0 space-y-2 rounded-lg border p-6">
            <h3 className="text-fg font-strong text-base">{t("dataTitle")}</h3>
            <p className="text-fg-muted text-sm">{t("dataBody")}</p>
          </article>
        </div>
      </Section>

      {/* Compliance — honest "not yet certified" */}
      <Section padding="md">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("complianceTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("complianceBody")}</p>
          <ul className="space-y-2">
            {COMPLIANCE_KEYS.map((k) => (
              <li
                key={k}
                className="border-border bg-surface text-fg rounded-md border px-4 py-3 text-sm"
              >
                {t(`compliance.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Request info */}
      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("requestTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("requestBody")}</p>
          <a
            href="mailto:security@molesignal.io?subject=Security%20review"
            className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-shadow"
          >
            {t("requestCta")}
          </a>
        </div>
      </Section>
    </>
  );
}
