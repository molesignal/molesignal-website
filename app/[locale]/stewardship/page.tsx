import { Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { GITHUB_REPO_URL } from "@/lib/community";

// Everything that stays Apache-2.0 and free for a single team, forever.
const FREE_KEYS = [
  "ingest",
  "correlation",
  "realtime",
  "multitenant",
  "query",
  "selfhost",
] as const;

// The buyer-side features we charge for — never the daily-user features.
const PAID_KEYS = [
  "sso",
  "audit",
  "rbac",
  "compliance",
  "sla",
  "managed",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stewardship" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function StewardshipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("stewardship");

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

      {/* The promise — left brand accent */}
      <Section padding="md">
        <div className="border-primary mx-auto max-w-3xl space-y-3 border-l-2 pl-5">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("promiseTitle")}
          </h2>
          <p className="text-fg text-lg">{t("promiseBody")}</p>
        </div>
      </Section>

      {/* Free vs Paid */}
      <Section padding="md" tint="surface">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="border-border bg-bg-0 space-y-4 rounded-2xl border p-6">
            <div className="space-y-1">
              <h3 className="text-fg font-display-strong text-display-sm leading-tight">
                {t("freeTitle")}
              </h3>
              <p className="text-fg-muted text-sm">{t("freeLede")}</p>
            </div>
            <ul className="space-y-2">
              {FREE_KEYS.map((k) => (
                <li
                  key={k}
                  className="text-fg flex items-start gap-2 text-sm"
                >
                  <Check
                    size={14}
                    className="text-green mt-0.5 shrink-0"
                    aria-hidden
                  />
                  <span>{t(`free.${k}`)}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="border-border bg-bg-0 space-y-4 rounded-2xl border p-6">
            <div className="space-y-1">
              <h3 className="text-fg font-display-strong text-display-sm leading-tight">
                {t("paidTitle")}
              </h3>
              <p className="text-fg-muted text-sm">{t("paidLede")}</p>
            </div>
            <ul className="space-y-2">
              {PAID_KEYS.map((k) => (
                <li
                  key={k}
                  className="text-fg flex items-start gap-2 text-sm"
                >
                  <Check
                    size={14}
                    className="text-primary mt-0.5 shrink-0"
                    aria-hidden
                  />
                  <span>{t(`paid.${k}`)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      {/* How the code is organised */}
      <Section padding="md">
        <div className="mx-auto max-w-3xl space-y-3">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("codeTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("codeBody")}</p>
        </div>
      </Section>

      {/* CTA */}
      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("ctaTitle")}
          </h2>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href={`${GITHUB_REPO_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
              className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center gap-2 rounded-md border px-5 text-base font-strong transition-colors"
            >
              {t("ctaLicense")}
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-shadow"
            >
              {t("ctaStar")}
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
