import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DesignPartnerForm } from "@/components/design-partner-form";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "designPartner" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function DesignPartnerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("designPartner");

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

      <Section padding="md">
        <h2 className="text-display-md font-display-strong mb-6 tracking-tighter">
          {t("youGetTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [t("youGet1"), t("youGet1Body")],
            [t("youGet2"), t("youGet2Body")],
            [t("youGet3"), t("youGet3Body")],
            [t("youGet4"), t("youGet4Body")],
          ].map(([title, body], i) => (
            <article
              key={i}
              className="border-border bg-surface space-y-2 rounded-lg border p-5"
            >
              <div className="text-fg-muted font-mono text-xs tabular-nums">
                {String(i + 1).padStart(2, "0")} / 04
              </div>
              <h3 className="text-fg font-strong text-base">{title}</h3>
              <p className="text-fg-muted text-sm">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("whoTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("whoBody")}</p>
        </div>
      </Section>

      <Section padding="md" id="apply">
        <div className="mx-auto max-w-2xl">
          <DesignPartnerForm />
        </div>
      </Section>

      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("afterTitle")}
          </h2>
          <ol className="space-y-0">
            {[t("after1"), t("after2"), t("after3")].map((step, i, arr) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Dashed connector between steps (vertical, desktop only) */}
                {i < arr.length - 1 && (
                  <span
                    aria-hidden
                    className="border-bd-1 absolute top-9 bottom-0 left-4 hidden w-px border-l border-dashed md:block"
                  />
                )}
                <span className="bg-primary-bg text-primary z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-lg font-strong tabular-nums">
                  {i + 1}
                </span>
                <span className="text-fg pt-1 text-sm leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section padding="md" id="faq">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("faqTitle")}
          </h2>
          <ul className="space-y-2">
            {[
              [t("faq1Q"), t("faq1A")],
              [t("faq2Q"), t("faq2A")],
              [t("faq3Q"), t("faq3A")],
              [t("faq4Q"), t("faq4A")],
              [t("faq5Q"), t("faq5A")],
            ].map(([q, a], i) => (
              <li key={i}>
                <details className="border-border bg-surface group rounded-md border">
                  <summary className="text-fg cursor-pointer select-none px-4 py-3 text-sm font-strong">
                    {q}
                  </summary>
                  <div className="text-fg-muted border-border border-t px-4 py-3 text-sm">
                    {a}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h3 className="text-fg-muted text-base font-strong">
            {t("notReadyTitle")}
          </h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="https://github.com/molesignal/molesignal"
              target="_blank"
              rel="noreferrer"
              data-analytics-event="github_star_click"
              data-analytics-source-page
              className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 font-strong transition-colors"
            >
              {t("notReadyStar")} <ArrowRight size={12} aria-hidden />
            </a>
            <Link
              href="/cloud"
              className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 font-strong transition-colors"
            >
              {t("notReadyCloud")} <ArrowRight size={12} aria-hidden />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
