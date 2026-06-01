import Script from "next/script";

/**
 * Plausible — privacy-friendly analytics. Loads the script only when both
 * `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set AND we're not on localhost (Vercel
 * preview deploys still emit, prod emits, local dev stays clean).
 *
 * Plausible respects Do Not Track by default. No cookies, no
 * fingerprinting — aligned with the Astral/Bun-style OSS vibe in
 * DESIGN_BRIEF.md.
 *
 * Event tracking (CTA clicks, form submits, theme/locale toggles) is wired
 * via the helper in lib/analytics.ts.
 */
export function PlausibleScript() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const apiHost =
    process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST ?? "https://plausible.io";

  if (!domain) return null;

  return (
    <>
      <Script
        defer
        strategy="afterInteractive"
        data-domain={domain}
        src={`${apiHost}/js/script.outbound-links.tagged-events.js`}
      />
      {/* Expose the queue so lib/analytics.ts can fire events. */}
      <Script id="plausible-queue" strategy="afterInteractive">
        {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments); };`}
      </Script>
    </>
  );
}
