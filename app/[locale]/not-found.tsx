import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("errors");

  return (
    <Section padding="lg" tint="hero">
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <p className="text-marketing-accent font-mono text-sm font-strong">
          404
        </p>
        <h1 className="text-display-xl font-display-strong tracking-tighter">
          {t("notFoundTitle")}
        </h1>
        <p className="text-fg-muted text-lg">{t("notFoundBody")}</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-strong transition-shadow"
          >
            {t("notFoundHome")} <ArrowRight size={14} aria-hidden />
          </Link>
          <Link
            href="/start"
            className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-10 items-center rounded-md border px-4 text-sm font-strong transition-colors"
          >
            {t("notFoundStart")}
          </Link>
          <a
            href="https://github.com/molesignal/molesignal"
            target="_blank"
            rel="noreferrer"
            className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-strong transition-colors"
          >
            {t("notFoundGitHub")} <ArrowUpRight size={10} aria-hidden />
          </a>
        </div>
      </div>
    </Section>
  );
}
