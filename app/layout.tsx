import "@fontsource-variable/inter";
import "./globals.css";

import type { Metadata } from "next";

import { PlausibleScript } from "@/components/analytics/plausible";

export const metadata: Metadata = {
  metadataBase: new URL("https://molesignal.io"),
  title: {
    default: "molesignal — Logs, metrics, traces. One storage. Self-hosted.",
    template: "%s · molesignal",
  },
  description:
    "Self-hosted, OpenTelemetry-native observability. Three signals share one storage layer and one query engine — without the Datadog bill.",
  icons: {
    icon: "/favicon.svg",
  },
};

/**
 * Anti-flash inline script. Runs before React hydrates, reads the
 * persisted theme from localStorage (default: "light"), resolves
 * "system" via prefers-color-scheme, and sets <html data-theme>.
 *
 * Must live in <head> as a raw HTML string so React doesn't try to
 * re-render it as a component (React 19 would otherwise warn that
 * <script> children of components are inert).
 *
 * Synced with constants in components/theme-provider.tsx.
 */
const ANTI_FLASH_SCRIPT = `(function(){try{var k='molesignal-theme';var t=localStorage.getItem(k)||'light';var r=t;if(t==='system'){r=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

/**
 * Root layout. Holds <html>/<body> with Inter Variable + token cascade.
 * Anti-flash theme script lives here so it runs before React hydrates.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }}
        />
        <PlausibleScript />
      </head>
      <body className="font-sans min-h-full antialiased">{children}</body>
    </html>
  );
}
