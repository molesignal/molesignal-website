import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { GitHubStatsChip } from "@/components/github-stats-chip";
import { Footer } from "@/components/layout/footer";
import { PreReleaseBanner } from "@/components/layout/pre-release-banner";
import { TopNav } from "@/components/layout/top-nav";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SkipToContent } from "@/components/skip-to-content";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale-aware layout. This is the chrome wrapping every page:
 * PreReleaseBanner → TopNav → <main> → Footer → Sonner toaster.
 *
 * GitHub stars chip slot inside TopNav stays empty until M3.2 wires it up.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <ThemeProvider>
        <SkipToContent />
        <PreReleaseBanner />
        <TopNav githubStarsSlot={<GitHubStatsChip />} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <ScrollToTop />
        <Toaster position="bottom-right" richColors closeButton />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
