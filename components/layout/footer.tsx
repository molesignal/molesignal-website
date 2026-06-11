import { ArrowUpRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoMark } from "@/components/logo-mark";
import { Link } from "@/i18n/navigation";
import { getCmsFooterNav } from "@/lib/cms";
import { GITHUB_REPO_URL, getDiscordInviteUrl } from "@/lib/community";

/**
 * Render model shared by both footer sources. Labels are already resolved
 * strings here — either from the CMS (Navigation global, localized) or from
 * `messages/{locale}.json` for the static fallback.
 */
type FooterItem = {
  label: string;
  href?: string;
  external?: boolean;
  /**
   * Honest "not yet" state (P0-4). Renders muted, non-clickable text with a
   * "launching soon" tooltip instead of a placeholder `href="#"`.
   */
  disabled?: boolean;
};

type Col = {
  title: string;
  items: FooterItem[];
};

type Translate = (key: string) => string;

/**
 * Static fallback columns — used whenever the CMS is unreachable or its
 * Navigation global is empty, so the footer never ships blank. The Discord
 * item is config-driven (T17): with an invite URL it's a real external link;
 * otherwise it keeps the honest disabled "launching soon" state.
 */
function staticColumns(
  t: Translate,
  tLinks: Translate,
  discordInvite: string | null,
): Col[] {
  return [
    {
      title: t("product"),
      items: [
        { label: tLinks("why"), href: "/why" },
        { label: tLinks("architecture"), href: "/architecture" },
        { label: tLinks("quickStart"), href: "/start" },
        { label: tLinks("pricing"), href: "/pricing" },
        { label: tLinks("cloud"), href: "/cloud" },
      ],
    },
    {
      // Commercial / trust cluster — where procurement & security reviewers go.
      title: t("enterprise"),
      items: [
        { label: tLinks("enterprise"), href: "/enterprise" },
        { label: tLinks("security"), href: "/security" },
        { label: tLinks("stewardship"), href: "/stewardship" },
      ],
    },
    {
      title: t("resources"),
      items: [
        {
          label: tLinks("docs"),
          href: "https://docs.molesignal.io",
          external: true,
        },
        { label: tLinks("blog"), href: "/blog" },
        { label: tLinks("roadmap"), href: "/roadmap" },
        { label: tLinks("designPartner"), href: "/design-partner" },
      ],
    },
    {
      title: t("community"),
      items: [
        { label: tLinks("github"), href: GITHUB_REPO_URL, external: true },
        discordInvite
          ? { label: tLinks("discord"), href: discordInvite, external: true }
          : { label: tLinks("discord"), disabled: true },
        { label: tLinks("twitter"), disabled: true },
      ],
    },
  ];
}

/**
 * Site footer: 4 columns on desktop, single stacked column on mobile.
 * Bottom bar contains logo + copyright + CMS-managed tags + cloud teaser +
 * locale switcher.
 *
 * Columns and bottom tags come from the CMS Navigation global when available
 * (content team can edit them without a deploy); otherwise the static columns
 * above render from `messages/{locale}.json`.
 */
export async function Footer() {
  const t = await getTranslations("footer");
  const tLinks = await getTranslations("footer.links");
  const locale = (await getLocale()) === "zh" ? "zh" : "en";
  const year = new Date().getFullYear();

  const nav = await getCmsFooterNav(locale);
  const columns: Col[] = nav
    ? nav.columns.map((col) => ({
        title: col.title,
        items: col.links.map((link) => ({
          label: link.label,
          href: link.href,
          external: link.external,
          disabled: link.comingSoon,
        })),
      }))
    : staticColumns(t, tLinks, getDiscordInviteUrl());
  const badges = nav?.badges ?? [];

  return (
    <footer className="bg-surface border-border mt-section-md border-t">
      <div className="page-container py-section-md">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h3 className="text-fg-muted font-strong text-xs tracking-wide uppercase">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    {item.disabled || !item.href ? (
                      <span
                        title={t("launchingSoon")}
                        aria-disabled="true"
                        className="text-tx-3 inline-flex cursor-default items-center gap-1.5 text-sm"
                      >
                        {item.label}
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
                        {item.label}
                        <ArrowUpRight size={9} aria-hidden />
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-fg-muted hover:text-fg duration-fast text-sm transition-colors"
                      >
                        {item.label}
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <LogoMark size={18} />
            <p className="text-fg-muted text-xs">{t("copyright", { year })}</p>
            {/* CMS-managed footer tags (Navigation.footerBadges) */}
            {badges.map((badge) =>
              badge.href && badge.href.startsWith("/") ? (
                <Link
                  key={badge.label}
                  href={badge.href}
                  className="border-border text-fg-muted hover:text-fg duration-fast rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase transition-colors"
                >
                  {badge.label}
                </Link>
              ) : badge.href ? (
                <a
                  key={badge.label}
                  href={badge.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border text-fg-muted hover:text-fg duration-fast rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase transition-colors"
                >
                  {badge.label}
                </a>
              ) : (
                <span
                  key={badge.label}
                  className="border-border text-fg-muted rounded-full border px-2 py-0.5 text-[10px] tracking-wide uppercase"
                >
                  {badge.label}
                </span>
              ),
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/privacy"
              className="text-fg-muted hover:text-fg duration-fast text-xs transition-colors"
            >
              {tLinks("privacy")}
            </Link>
            <Link
              href="/terms"
              className="text-fg-muted hover:text-fg duration-fast text-xs transition-colors"
            >
              {tLinks("terms")}
            </Link>
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
