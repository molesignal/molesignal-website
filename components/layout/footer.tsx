import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoMark } from "@/components/logo-mark";
import { Link } from "@/i18n/navigation";
import { GITHUB_REPO_URL, getDiscordInviteUrl } from "@/lib/community";

type LinkItem = {
  /** Translation key inside `footer.links.*` */
  key: string;
  /** Omitted for `disabled` items, which render as non-clickable text. */
  href?: string;
  external?: boolean;
  /**
   * Honest "not yet" state (P0-4). Renders muted, non-clickable text with a
   * "launching soon" tooltip instead of a placeholder `href="#"`.
   */
  disabled?: boolean;
};

type Col = {
  /** Translation key inside `footer.*` for the column title */
  titleKey: string;
  items: LinkItem[];
};

/**
 * Builds the footer columns. The Discord item is config-driven (T17): when
 * `discordInvite` is set it renders a real external link; otherwise it keeps
 * the honest disabled "launching soon" state (never a placeholder `href="#"`).
 */
function buildColumns(discordInvite: string | null): Col[] {
  return [
    {
      titleKey: "product",
      items: [
        { key: "why", href: "/why" },
        { key: "quickStart", href: "/start" },
        { key: "architecture", href: "/architecture" },
        { key: "pricing", href: "/pricing" },
        { key: "cloud", href: "/cloud" },
        { key: "roadmap", href: "/roadmap" },
        { key: "changelog", href: "/changelog" },
      ],
    },
    {
      titleKey: "resources",
      items: [
        { key: "blog", href: "/blog" },
        // Anchors to the /start install section (Quick Start tabs). The binary
        // tab's "v1.0 target" notice lives there. Uses #install — the Section's
        // real id — because #binary maps to no DOM element (Radix auto-ids its
        // tab panels and unmounts the inactive ones).
        { key: "download", href: "/start#install" },
        { key: "designPartner", href: "/design-partner" },
      ],
    },
    {
      titleKey: "community",
      items: [
        { key: "github", href: GITHUB_REPO_URL, external: true },
        // Discord flips to a real external link once an invite URL is
        // configured; until then it stays an honest disabled state, not `href="#"`.
        discordInvite
          ? { key: "discord", href: discordInvite, external: true }
          : { key: "discord", disabled: true },
        // Twitter / X isn't live yet — honest disabled state.
        { key: "twitter", disabled: true },
      ],
    },
    {
      titleKey: "legal",
      items: [
        { key: "privacy", href: "/privacy" },
        { key: "terms", href: "/terms" },
      ],
    },
  ];
}

/**
 * Site footer: 4 columns on desktop, single stacked column on mobile.
 * Bottom bar contains logo + copyright + cloud teaser + locale switcher.
 *
 * All column titles and link labels resolve through `messages/{locale}.json`
 * under the `footer` and `footer.links` namespaces.
 */
export function Footer() {
  const t = useTranslations("footer");
  const tLinks = useTranslations("footer.links");
  const year = new Date().getFullYear();
  const columns = buildColumns(getDiscordInviteUrl());

  return (
    <footer className="bg-surface border-border mt-section-md border-t">
      <div className="page-container py-section-md">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.titleKey} className="space-y-3">
              <h3 className="text-fg-muted font-strong text-xs tracking-wide uppercase">
                {t(col.titleKey)}
              </h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.key}>
                    {item.disabled ? (
                      <span
                        title={t("launchingSoon")}
                        aria-disabled="true"
                        className="text-tx-3 inline-flex cursor-default items-center gap-1.5 text-sm"
                      >
                        {tLinks(item.key)}
                        <span className="border-border text-fg-muted rounded border px-1 py-px text-[10px] tracking-wide uppercase">
                          {t("soon")}
                        </span>
                      </span>
                    ) : item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fg-muted hover:text-fg duration-fast inline-flex items-center gap-1 text-sm transition-colors"
                      >
                        {tLinks(item.key)}
                        <ArrowUpRight size={9} aria-hidden />
                      </a>
                    ) : (
                      <Link
                        href={item.href!}
                        className="text-fg-muted hover:text-fg duration-fast text-sm transition-colors"
                      >
                        {tLinks(item.key)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-border mt-section-md flex flex-col items-start gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={18} />
            <p className="text-fg-muted text-xs">{t("copyright", { year })}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/cloud"
              className="text-fg-muted hover:text-primary duration-fast inline-flex items-center gap-1 text-xs transition-colors"
            >
              {t("cloudComing")}
              <span aria-hidden>→</span>
            </Link>
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
