"use client";

import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoMark } from "@/components/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { GITHUB_REPO_URL } from "@/lib/community";
import { cn } from "@/lib/utils";

type DirectLink = {
  href: string;
  labelKey: string;
  external?: boolean;
};

type DropChild = {
  href: string;
  labelKey: string;
  subKey: string;
  external?: boolean;
};

type DropGroup = {
  labelKey: string;
  children: DropChild[];
};

// One domain, one brand, split by *action* not version (GitLab / Supabase /
// PostHog pattern). The two highest purchase-intent destinations — Docs and
// Enterprise — are first-class links instead of being buried in a dropdown;
// Pricing sits between them. Product and Community are the two grouped menus.
const DIRECT_LINKS: DirectLink[] = [
  { href: "https://docs.molesignal.io", labelKey: "docs", external: true },
  { href: "/pricing", labelKey: "pricing" },
  { href: "/enterprise", labelKey: "enterprise" },
];

const PRODUCT_GROUP: DropGroup = {
  labelKey: "product",
  children: [
    { href: "/why", labelKey: "why", subKey: "whySub" },
    {
      href: "/architecture",
      labelKey: "architecture",
      subKey: "architectureSub",
    },
    { href: "/start", labelKey: "quickStart", subKey: "quickStartSub" },
  ],
};

const COMMUNITY_GROUP: DropGroup = {
  labelKey: "community",
  children: [
    {
      href: GITHUB_REPO_URL,
      labelKey: "github",
      subKey: "githubSub",
      external: true,
    },
    { href: "/roadmap", labelKey: "roadmap", subKey: "roadmapSub" },
    { href: "/blog", labelKey: "blog", subKey: "blogSub" },
  ],
};

/**
 * Sticky top navigation.
 *
 * Desktop (≥ 1024px):
 *   [Logo] · Product ▾ · Docs ↗ · Pricing · Enterprise · Community ▾ ·
 *           GitHub chip · Locale · Theme · CTA
 *
 * Docs and Enterprise are the highest purchase-intent destinations, so they
 * are first-class links rather than dropdown children. Product groups the
 * "learn the product" pages; Community groups the "after you know it" ones.
 *
 * Tablet (≥ 768px, < 1024px) collapses the nav into the mobile sheet; only the
 * CTA and chip stay inline. Mobile (< 768px) is fully in the right-side Sheet,
 * where each group renders as a header + indented children.
 */
export function TopNav({
  githubStarsSlot,
}: {
  githubStarsSlot?: React.ReactNode;
}) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    !href.startsWith("http") && pathname.startsWith(href);

  // A dropdown reads as active when any of its internal children matches.
  const groupActive = (group: DropGroup) =>
    group.children.some((c) => !c.external && pathname.startsWith(c.href));

  // Active state is a 2px brand underline, not a filled pill (05-UI §3.4). The
  // base reserves a transparent 2px bottom border so the row height is stable.
  const itemClass = (active: boolean) =>
    cn(
      "duration-fast inline-flex items-center gap-1 border-b-2 px-3 py-1.5 text-sm font-strong transition-colors",
      active
        ? "border-brand text-fg"
        : "border-transparent text-fg-muted hover:text-fg",
    );

  const renderDropdown = (group: DropGroup) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          itemClass(groupActive(group)),
          "data-[state=open]:text-fg outline-none",
        )}
      >
        {t(group.labelKey)}
        <ChevronDown
          size={12}
          aria-hidden
          className="duration-fast transition-transform data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" sideOffset={8} className="w-64 p-1">
        {group.children.map((child) => (
          <NavMenuItem
            key={child.href}
            child={child}
            label={t(child.labelKey)}
            sub={t(child.subKey)}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderMobileGroup = (group: DropGroup) => (
    <div className="border-border mt-2 border-t pt-2">
      <p className="text-fg-muted font-strong -mx-2 px-2 py-2 text-xs tracking-wide uppercase">
        {t(group.labelKey)}
      </p>
      {group.children.map((child) => (
        <MobileRow
          key={child.href}
          href={child.href}
          label={t(child.labelKey)}
          external={child.external}
          onNavigate={() => setMobileOpen(false)}
        />
      ))}
    </div>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-[background-color,border-color,backdrop-filter]",
        scrolled
          ? "border-border bg-surface/90 border-b backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="page-container h-nav flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="hover:bg-bg-hover duration-fast inline-flex items-center gap-2 rounded-md px-2 py-1 transition-colors"
        >
          <LogoMark size={22} />
          {/* Wordmark in monospace — reads like a CLI tool name (05-UI §3.4) */}
          <span className="text-fg font-mono font-mono-strong text-mono-lg">
            molesignal
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label={t("menu")}
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
        >
          {renderDropdown(PRODUCT_GROUP)}
          {DIRECT_LINKS.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={itemClass(false)}
              >
                {t(item.labelKey)}
                <ArrowUpRight size={11} aria-hidden />
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={itemClass(isActive(item.href))}
              >
                {t(item.labelKey)}
              </Link>
            ),
          )}
          {renderDropdown(COMMUNITY_GROUP)}
        </nav>

        {/* Right utility cluster — desktop / tablet */}
        <div className="hidden items-center gap-2 md:flex">
          {githubStarsSlot}
          <LocaleSwitcher className="hidden lg:inline-flex" />
          <ThemeToggle className="hidden lg:inline-flex" />
          <Link
            href="/start"
            data-analytics-event="cta_click"
            data-analytics-source-page
            data-analytics-props='{"label":"Try it","destination":"/start"}'
            className="bg-primary text-primary-foreground hover:shadow-glow-brand duration-fast font-strong inline-flex h-8 items-center gap-1 rounded-md px-3 text-sm transition-shadow"
          >
            {tc("tryIt")}
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Mobile trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t("openMenu")}
              className="border-border text-fg hover:bg-bg-hover duration-fast inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors md:hidden"
            >
              <Menu size={18} aria-hidden />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm">
            <div className="flex h-full flex-col gap-6 p-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center gap-2"
                >
                  <LogoMark size={20} />
                  <span className="font-display-strong">molesignal</span>
                </Link>
                <button
                  type="button"
                  aria-label={t("closeMenu")}
                  onClick={() => setMobileOpen(false)}
                  className="hover:bg-bg-hover duration-fast inline-flex h-8 w-8 items-center justify-center rounded transition-colors"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>

              <nav className="flex flex-col">
                {renderMobileGroup(PRODUCT_GROUP)}

                {/* High-intent direct links */}
                <div className="border-border mt-2 border-t pt-2">
                  {DIRECT_LINKS.map((item) => (
                    <MobileRow
                      key={item.href}
                      href={item.href}
                      label={t(item.labelKey)}
                      external={item.external}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
                </div>

                {renderMobileGroup(COMMUNITY_GROUP)}
              </nav>

              <div className="border-border space-y-3 border-t pt-4">
                <div className="text-fg-muted text-xs tracking-wide uppercase">
                  Theme
                </div>
                <ThemeToggle />
                <div className="text-fg-muted text-xs tracking-wide uppercase">
                  Language
                </div>
                <LocaleSwitcher />
              </div>

              <div className="mt-auto">
                <Link
                  href="/start"
                  onClick={() => setMobileOpen(false)}
                  data-analytics-event="cta_click"
                  data-analytics-source-page
                  data-analytics-props='{"label":"Try it","destination":"/start"}'
                  className="bg-primary text-primary-foreground hover:shadow-glow-brand font-strong inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2.5 text-base transition-shadow"
                >
                  {tc("tryIt")}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

/**
 * One row inside a desktop dropdown. Two-line layout (label + sublabel) so the
 * menu reads as a real menu, not just more links.
 */
function NavMenuItem({
  child,
  label,
  sub,
}: {
  child: DropChild;
  label: string;
  sub: string;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1">
        <span className="text-fg font-strong text-sm">{label}</span>
        {child.external && (
          <ArrowUpRight size={9} aria-hidden className="text-fg-muted" />
        )}
      </div>
      <span className="text-fg-muted text-xs">{sub}</span>
    </>
  );

  if (child.external) {
    return (
      <DropdownMenuItem asChild>
        <a
          href={child.href}
          target="_blank"
          rel="noreferrer"
          className="flex cursor-pointer flex-col items-start gap-0.5"
        >
          {content}
        </a>
      </DropdownMenuItem>
    );
  }
  return (
    <DropdownMenuItem asChild>
      <Link
        href={child.href}
        className="flex cursor-pointer flex-col items-start gap-0.5"
      >
        {content}
      </Link>
    </DropdownMenuItem>
  );
}

/**
 * One row in the mobile Sheet — a plain link with an optional external ↗.
 */
function MobileRow({
  href,
  label,
  external,
  onNavigate,
}: {
  href: string;
  label: string;
  external?: boolean;
  onNavigate: () => void;
}) {
  const className =
    "text-fg hover:bg-bg-hover -mx-2 inline-flex items-center justify-between gap-2 rounded-md px-2 py-2 text-base font-strong";
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={onNavigate}
        className={className}
      >
        {label}
        <ArrowUpRight size={12} aria-hidden />
      </a>
    );
  }
  return (
    <Link href={href} onClick={onNavigate} className={className}>
      {label}
    </Link>
  );
}
