import type { ReactNode } from "react";

import { Section } from "@/components/ui/section";

/**
 * One structured section of a legal document: a heading, one or more body
 * paragraphs, and an optional bullet list. Shape mirrors the `legal.*.sections`
 * entries in `messages/{en,zh}.json` (kept in EN/ZH parity by
 * `scripts/check-i18n-parity.ts`).
 */
export type LegalSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

/**
 * Renders a privacy/terms-style legal document from structured i18n content.
 * Presentational only — pages fetch the content (via `getMessages()` for the
 * `sections` array and `getTranslations().rich()` for link-bearing strings)
 * and pass it in. `disclaimer`/`footer` are ReactNodes so callers can inject
 * real anchors (mailto, license) rather than bare URL text.
 */
export function LegalDocument({
  title,
  lastUpdated,
  disclaimer,
  intro,
  sections,
  footer,
}: {
  title: string;
  lastUpdated: string;
  disclaimer: ReactNode;
  intro: string;
  sections: LegalSection[];
  footer?: ReactNode;
}) {
  return (
    <Section padding="lg">
      <div className="prose-container space-y-8">
        <header className="space-y-3">
          <h1 className="text-display-lg font-display-strong tracking-tighter">
            {title}
          </h1>
          <p className="text-fg-muted text-sm">{lastUpdated}</p>
          <p className="text-fg-muted border-border bg-surface-muted rounded-md border p-3 text-sm">
            {disclaimer}
          </p>
        </header>

        <p className="text-fg text-base">{intro}</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-display-md font-display-strong tracking-tight">
                {section.heading}
              </h2>
              {section.body.map((paragraph, i) => (
                <p key={i} className="text-fg text-base">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="text-fg list-disc space-y-1 pl-5 text-base">
                  {section.bullets.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        {footer ? <p className="text-fg text-base">{footer}</p> : null}
      </div>
    </Section>
  );
}
