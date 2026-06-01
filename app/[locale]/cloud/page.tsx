import { ArrowRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CloudWaitlistForm } from "@/components/cloud-waitlist-form";
import { Pill } from "@/components/ui/pill";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cloud" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CloudPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cloud");
  const tCommon = await getTranslations("common");

  return (
    <>
      <Section padding="lg" tint="hero">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Pill variant="marketing">{tCommon("comingSoon")}</Pill>
          <h1 className="text-display-xl md:text-display-2xl font-display-strong tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-fg-muted text-lg">{t("lede")}</p>
        </div>
      </Section>

      <Section padding="md">
        <h2 className="text-display-md font-display-strong mb-6 tracking-tighter">
          {t("consideringTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [t("consider1"), t("consider1Body")],
            [t("consider2"), t("consider2Body")],
            [t("consider3"), t("consider3Body")],
          ].map(([title, body], i) => (
            <article
              key={i}
              className="border-border bg-surface space-y-2 rounded-lg border p-5"
            >
              <h3 className="text-fg font-strong text-base">{title}</h3>
              <p className="text-fg-muted text-sm">{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("whenTitle")}
          </h2>
          <p className="text-fg-muted text-lg">{t("whenBody")}</p>
        </div>
      </Section>

      <Section padding="md">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("joinTitle")}
          </h2>
          <CloudWaitlistForm />
        </div>
      </Section>

      <Section padding="md" tint="surface">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-display-md font-display-strong tracking-tighter">
            {t("todoTitle")}
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/start"
              className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 font-strong transition-colors"
            >
              {t("selfHost")} <ArrowRight size={12} aria-hidden />
            </Link>
            <Link
              href="/design-partner"
              className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 font-strong transition-colors"
            >
              {t("shape")} <ArrowRight size={12} aria-hidden />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
