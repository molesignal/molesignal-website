import { ArrowRight, Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

// Real, already-committed deliverables (mirrors the pricing Enterprise tier).
const GET_KEYS = [
  "sla",
  "patches",
  "audit",
  "onboarding",
  "support",
  "priority",
] as const;

// Honest "planned, not shipped" controls — the buyer-side features. Rendered
// with a dashed card + "Planned" tag so we never imply they exist today.
const ROADMAP_KEYS = ["sso", "audit", "rbac", "compliance"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "enterprise" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EnterprisePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("enterprise");

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

      {/* What you get — the real, committed items */}
      <Section padding="md">
        <div className="mb-8 max-w-3xl space-y-3">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("getTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("getLede")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {GET_KEYS.map((k) => (
            <article
              key={k}
              className="border-border bg-surface space-y-2 rounded-lg border p-5"
            >
              <div className="flex items-center gap-2">
                <Check size={16} className="text-primary shrink-0" aria-hidden />
                <h3 className="text-fg font-strong text-base">
                  {t(`get.${k}Title`)}
                </h3>
              </div>
              <p className="text-fg-muted text-sm">{t(`get.${k}Body`)}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Security & compliance — point at the trust page */}
      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("securityTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("securityBody")}</p>
          <Link
            href="/security"
            className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 text-sm font-strong transition-colors"
          >
            {t("securityCta")} <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      </Section>

      {/* On the roadmap — honest, dashed, tagged "Planned" */}
      <Section padding="md">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("roadmapTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("roadmapBody")}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ROADMAP_KEYS.map((k) => (
              <li
                key={k}
                className="border-border bg-surface flex items-center justify-between gap-2 rounded-md border border-dashed px-4 py-3"
              >
                <span className="text-fg text-sm font-strong">
                  {t(`roadmap.${k}`)}
                </span>
                <span className="border-border text-fg-muted rounded border px-1.5 py-px text-[10px] tracking-wide uppercase">
                  {t("roadmapTag")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Deployment */}
      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("deployTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("deployBody")}</p>
        </div>
      </Section>

      {/* CTA */}
      <Section padding="md">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("ctaTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("ctaBody")}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="mailto:founders@molesignal.io?subject=Enterprise%20inquiry"
              data-analytics-event="cta_click"
              data-analytics-source-page
              data-analytics-props='{"label":"Enterprise — Talk to founders","destination":"mailto:founders"}'
              className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-shadow"
            >
              {t("ctaTalk")} <ArrowRight size={16} aria-hidden />
            </a>
            <Link
              href="/design-partner"
              className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center gap-2 rounded-md border px-5 text-base font-strong transition-colors"
            >
              {t("ctaPartner")}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
