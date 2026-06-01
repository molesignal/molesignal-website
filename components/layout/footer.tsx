import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoMark } from "@/components/logo-mark";
import { Link } from "@/i18n/navigation";

type LinkItem = {
  /** Translation key inside `footer.links.*` */
  key: string;
  href: string;
  external?: boolean;
};

type Col = {
  /** Translation key inside `footer.*` for the column title */
  titleKey: string;
  items: LinkItem[];
};

const COLUMNS: Col[] = [
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
      { key: "docs", href: "https://docs.molesignal.io", external: true },
      { key: "blog", href: "/blog" },
      {
        key: "download",
        href: "https://github.com/molesignal/molesignal/releases",
        external: true,
      },
      { key: "designPartner", href: "/design-partner" },
    ],
  },
  {
    titleKey: "community",
    items: [
      {
        key: "github",
        href: "https://github.com/molesignal/molesignal",
        external: true,
      },
      { key: "discord", href: "#", external: true },
      { key: "twitter", href: "#", external: true },
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

  return (
    <footer className="bg-surface border-border mt-section-md border-t">
      <div className="page-container py-section-md">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.titleKey} className="space-y-3">
              <h3 className="text-fg-muted text-xs font-strong tracking-wide uppercase">
                {t(col.titleKey)}
              </h3>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.key}>
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fg hover:text-primary duration-fast inline-flex items-center gap-1 text-sm transition-colors"
                      >
                        {tLinks(item.key)}
                        <ArrowUpRight size={9} aria-hidden />
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-fg hover:text-primary duration-fast text-sm transition-colors"
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
