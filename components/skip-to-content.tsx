import { useTranslations } from "next-intl";

/**
 * Accessibility: keyboard users land on this link first. It's visually
 * hidden until focused, then becomes a real focusable element that jumps
 * to the page main region (id="main" on the layout's <main> element).
 */
export function SkipToContent() {
  const t = useTranslations("nav");
  return (
    <a
      href="#main"
      className="bg-primary text-primary-foreground focus-visible:shadow-focus sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded focus-visible:px-3 focus-visible:py-1.5 focus-visible:font-strong"
    >
      {t("skipToContent")}
    </a>
  );
}
