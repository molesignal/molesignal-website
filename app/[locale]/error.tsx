"use client";

import { ArrowRight, ArrowUpRight, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";

/**
 * Locale-scoped error boundary. Per Next 16 conventions this must be a
 * client component and exports a `reset` callback so the user can retry
 * without a full reload.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Wire to a real reporter in M5.4 (Plausible event + Sentry-like).
    console.error("[locale-error]", error);
  }, [error]);

  return (
    <Section padding="lg" tint="hero">
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <p className="text-red font-mono text-sm font-strong">500</p>
        <h1 className="text-display-xl font-display-strong tracking-tighter">
          {t("errorTitle")}
        </h1>
        <p className="text-fg-muted text-lg">{t("errorBody")}</p>
        {error.digest && (
          <p className="text-fg-muted font-mono text-xs">
            digest:{" "}
            <span className="text-fg select-all">{error.digest}</span>
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-strong transition-shadow"
          >
            <RefreshCcw size={14} aria-hidden /> {t("errorRetry")}
          </button>
          <Link
            href="/"
            className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-strong transition-colors"
          >
            {t("errorHome")} <ArrowRight size={14} aria-hidden />
          </Link>
          <a
            href="https://github.com/molesignal/molesignal/issues/new"
            target="_blank"
            rel="noreferrer"
            className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-strong transition-colors"
          >
            {t("errorIssue")} <ArrowUpRight size={10} aria-hidden />
          </a>
        </div>
      </div>
    </Section>
  );
}
