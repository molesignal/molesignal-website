import { ArrowRight, Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type TierKey = "oss" | "enterprise" | "cloud";

const TIER_KEYS: TierKey[] = ["oss", "enterprise", "cloud"];

const FEATURE_KEYS: Record<TierKey, string[]> = {
  oss: ["code", "ingest", "correlation", "realtime", "multiTenant", "community"],
  enterprise: ["everything", "sla", "patches", "audit", "onboarding", "priority"],
  cloud: ["managed", "byoc", "multitenant", "compliance", "waitlist", "migration"],
};

const TIER_HREF: Record<TierKey, string> = {
  oss: "/start",
  enterprise: "mailto:founders@molesignal.io?subject=Enterprise%20inquiry",
  cloud: "/cloud",
};

const COMPARE_DIMS = ["billing", "ops", "support", "deployment", "audit"] as const;

const FAQ_KEYS = ["free", "oss-vs-cloud", "enterprise-when", "cloud-launch", "migrate"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

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

      {/* Three tier cards */}
      <Section padding="md">
        <div className="grid gap-4 md:grid-cols-3" id="tiers">
          {TIER_KEYS.map((tier) => (
            <TierCard
              key={tier}
              tier={tier}
              badge={t(`tiers.${tier}.badge`)}
              price={t(`tiers.${tier}.price`)}
              priceSub={t(`tiers.${tier}.priceSub`)}
              headline={t(`tiers.${tier}.headline`)}
              bestFor={t(`tiers.${tier}.bestFor`)}
              features={FEATURE_KEYS[tier].map((k) =>
                t(`tiers.${tier}.features.${k}`),
              )}
              cta={t(`tiers.${tier}.cta`)}
            />
          ))}
        </div>
      </Section>

      {/* Compact comparison */}
      <Section padding="md" tint="surface" id="compare">
        <h2 className="text-display-md font-display-strong mb-6 tracking-tighter">
          {t("compareTitle")}
        </h2>
        <div className="border-border bg-bg-0 overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-border border-b">
                <th
                  scope="col"
                  className="bg-surface text-fg-muted sticky left-0 z-10 px-4 py-3 text-left text-xs font-strong uppercase tracking-wide"
                >
                  &nbsp;
                </th>
                {TIER_KEYS.map((tier) => (
                  <th
                    key={tier}
                    scope="col"
                    className={cn(
                      "px-4 py-3 text-left text-sm font-strong",
                      tier === "cloud" && "bg-marketing-accent-dim",
                      tier === "enterprise" && "bg-primary-bg",
                    )}
                  >
                    {t(`tiers.${tier}.badge`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_DIMS.map((dim, i) => (
                <tr
                  key={dim}
                  className={cn(
                    "border-border",
                    i < COMPARE_DIMS.length - 1 && "border-b",
                  )}
                >
                  <th
                    scope="row"
                    className="bg-surface text-fg sticky left-0 z-10 px-4 py-3 text-left text-sm font-strong"
                  >
                    {t(`compareDimensions.${dim}`)}
                  </th>
                  <td className="text-fg px-4 py-3 align-top">
                    {t(`compareCells.oss${capitalize(dim)}`)}
                  </td>
                  <td className="text-fg bg-primary-bg/40 px-4 py-3 align-top">
                    {t(`compareCells.enterprise${capitalize(dim)}`)}
                  </td>
                  <td className="text-fg bg-marketing-accent-dim/40 px-4 py-3 align-top">
                    {t(`compareCells.cloud${capitalize(dim)}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* FAQ */}
      <Section padding="md" id="faq">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("faqTitle")}
          </h2>
          <ul className="space-y-2">
            {FAQ_KEYS.map((key) => (
              <li key={key}>
                <details className="border-border bg-surface group rounded-md border">
                  <summary className="text-fg cursor-pointer select-none px-4 py-3 text-sm font-strong">
                    {t(`faqs.${key}.q`)}
                  </summary>
                  <div className="text-fg-muted border-border border-t px-4 py-3 text-sm">
                    {t(`faqs.${key}.a`)}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Closing CTA */}
      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("ctaTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("ctaBody")}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="mailto:founders@molesignal.io?subject=Pricing%20question"
              className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-11 items-center gap-2 rounded-md px-5 text-base font-strong transition-shadow"
            >
              {t("ctaTalk")} <ArrowRight size={16} aria-hidden />
            </a>
            <Link
              href="/cloud"
              className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-11 items-center gap-2 rounded-md border px-5 text-base font-strong transition-colors"
            >
              {t("ctaWaitlist")}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

function capitalize<T extends string>(s: T): Capitalize<T> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}

function TierCard({
  tier,
  badge,
  price,
  priceSub,
  headline,
  bestFor,
  features,
  cta,
}: {
  tier: TierKey;
  badge: string;
  price: string;
  priceSub: string;
  headline: string;
  bestFor: string;
  features: string[];
  cta: string;
}) {
  const isPrimary = tier === "enterprise"; // Most commercially relevant — visually emphasized
  const isMarketing = tier === "cloud";
  const href = TIER_HREF[tier];
  const externalCTA = href.startsWith("mailto:") || href.startsWith("http");

  return (
    <article
      className={cn(
        "border-border bg-surface relative flex flex-col gap-5 rounded-2xl border p-6",
        isPrimary && "border-primary shadow-glow-indigo",
        isMarketing && "border-marketing-accent shadow-glow-pink",
      )}
    >
      <div className="space-y-2">
        <Pill
          variant={
            isPrimary ? "brand" : isMarketing ? "marketing" : "default"
          }
        >
          {badge}
        </Pill>
        <div>
          <div className="text-fg font-display-strong text-display-md leading-tight">
            {price}
          </div>
          <div className="text-fg-muted text-xs">{priceSub}</div>
        </div>
        <h3 className="text-fg font-strong text-base">{headline}</h3>
        <p className="text-fg-muted text-sm">{bestFor}</p>
      </div>

      <ul className="border-border space-y-2 border-t pt-4">
        {features.map((feature, i) => (
          <li
            key={i}
            className="text-fg flex items-start gap-2 text-sm"
          >
            <Check
              size={14}
              className={cn(
                "mt-0.5 shrink-0",
                isPrimary
                  ? "text-primary"
                  : isMarketing
                    ? "text-marketing-accent"
                    : "text-green",
              )}
              aria-hidden
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        {externalCTA ? (
          <a
            href={href}
            className={cn(
              "duration-fast inline-flex h-10 w-full items-center justify-center gap-1 rounded-md text-sm font-strong transition-shadow",
              isPrimary
                ? "bg-primary text-primary-foreground hover:shadow-glow-indigo"
                : isMarketing
                  ? "text-marketing-accent-fg hover:shadow-glow-pink"
                  : "border-border text-fg hover:bg-bg-hover border",
            )}
            style={
              isMarketing
                ? { backgroundImage: "var(--marketing-gradient-cta)" }
                : undefined
            }
          >
            {cta}
          </a>
        ) : (
          <Link
            href={href}
            className={cn(
              "duration-fast inline-flex h-10 w-full items-center justify-center gap-1 rounded-md text-sm font-strong transition-shadow",
              isPrimary
                ? "bg-primary text-primary-foreground hover:shadow-glow-indigo"
                : isMarketing
                  ? "text-marketing-accent-fg hover:shadow-glow-pink"
                  : "border-border text-fg hover:bg-bg-hover border",
            )}
            style={
              isMarketing
                ? { backgroundImage: "var(--marketing-gradient-cta)" }
                : undefined
            }
          >
            {cta}
          </Link>
        )}
      </div>
    </article>
  );
}
