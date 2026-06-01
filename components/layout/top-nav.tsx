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
import { cn } from "@/lib/utils";

type PrimaryItem = {
  kind: "link";
  href: string;
  labelKey: string;
  external?: boolean;
};

type ResourceChild = {
  href: string;
  labelKey: string;
  subKey: string;
  external?: boolean;
};

const PRIMARY_ITEMS: PrimaryItem[] = [
  { kind: "link", href: "/why", labelKey: "why" },
  { kind: "link", href: "/start", labelKey: "quickStart" },
  { kind: "link", href: "/architecture", labelKey: "architecture" },
  { kind: "link", href: "/pricing", labelKey: "pricing" },
  { kind: "link", href: "/cloud", labelKey: "cloud" },
];

// Resources dropdown — honest destinations only (UX §2.2). The old "Docs"
// entry pointed at docs.molesignal.io, which does not exist this milestone;
// it is removed rather than left as a dead link (P0-4). "Download" stays but
// anchors to the /start install section with a coming-soon sublabel, instead
// of linking to an unpublished GitHub release. Uses #install (the Section's
// real id), not #binary — Radix auto-ids its tab panels, so #binary resolves
// to nothing.
const RESOURCE_CHILDREN: ResourceChild[] = [
  { href: "/roadmap", labelKey: "roadmap", subKey: "roadmapSub" },
  { href: "/changelog", labelKey: "changelog", subKey: "changelogSub" },
  { href: "/blog", labelKey: "blog", subKey: "blogSub" },
  { href: "/start#install", labelKey: "download", subKey: "downloadSub" },
];

/**
 * Sticky top navigation.
 *
 * Layout (desktop ≥ 1024px):
 *   [Logo] · Primary items inline · [Resources ▾ dropdown] · GitHub chip ·
 *           Locale · Theme · "Try it" CTA
 *
 * The Resources dropdown groups Docs / Blog / Download — three destinations
 * the user goes to *after* knowing the product. Each child has a sublabel so
 * the menu reads as a real menu, not three more nav items.
 *
 * Tablet (≥ 768px, < 1024px) collapses primary items into the mobile sheet
 * to keep the navbar from wrapping; only the CTA and chip stay inline.
 *
 * Mobile (< 768px) goes fully into the right-side Sheet drawer; the
 * Resources group becomes a header + indented children there.
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

  // Active state for the Resources dropdown — true if any child path matches
  const resourcesActive = RESOURCE_CHILDREN.some(
    (c) => !c.external && pathname.startsWith(c.href),
  );

  const itemClass = (active: boolean) =>
    cn(
      "duration-fast inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-strong transition-colors",
      active
        ? "text-fg bg-bg-hover"
        : "text-fg-muted hover:text-fg hover:bg-bg-hover",
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-[background-color,border-color,backdrop-filter]",
        scrolled
          ? "border-border bg-surface/85 border-b backdrop-blur"
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
          <span className="text-fg font-display-strong text-base">
            molesignal
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label={t("menu")}
          className="hidden flex-1 items-center justify-center gap-1 lg:flex"
        >
          {PRIMARY_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={itemClass(isActive(item.href))}
            >
              {t(item.labelKey)}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                itemClass(resourcesActive),
                "data-[state=open]:bg-bg-hover data-[state=open]:text-fg outline-none",
              )}
            >
              {t("resources")}
              <ChevronDown
                size={12}
                aria-hidden
                className="duration-fast transition-transform data-[state=open]:rotate-180"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              sideOffset={8}
              className="w-64 p-1"
            >
              {RESOURCE_CHILDREN.map((child) => (
                <ResourceMenuItem
                  key={child.href}
                  child={child}
                  label={t(child.labelKey)}
                  sub={t(child.subKey)}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
            className="bg-primary text-primary-foreground hover:shadow-glow-indigo duration-fast font-strong inline-flex h-8 items-center gap-1 rounded-md px-3 text-sm transition-shadow"
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
                {PRIMARY_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-fg hover:bg-bg-hover font-strong -mx-2 inline-flex items-center justify-between rounded-md px-2 py-2 text-base"
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}

                {/* Resources group — header + indented children */}
                <div className="border-border mt-2 border-t pt-2">
                  <p className="text-fg-muted font-strong -mx-2 px-2 py-2 text-xs tracking-wide uppercase">
                    {t("resources")}
                  </p>
                  {RESOURCE_CHILDREN.map((child) => {
                    const className =
                      "text-fg hover:bg-bg-hover -mx-2 inline-flex items-center justify-between rounded-md px-2 py-2 text-base font-strong";
                    if (child.external) {
                      return (
                        <a
                          key={child.href}
                          href={child.href}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setMobileOpen(false)}
                          className={className}
                        >
                          {t(child.labelKey)}
                          <ArrowUpRight size={12} aria-hidden />
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={className}
                      >
                        {t(child.labelKey)}
                      </Link>
                    );
                  })}
                </div>
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
                  className="bg-primary text-primary-foreground hover:shadow-glow-indigo font-strong inline-flex w-full items-center justify-center gap-1 rounded-md px-4 py-2.5 text-base transition-shadow"
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
 * One row inside the Resources dropdown. Two-line layout (label on top,
 * sublabel underneath) so the menu reads as more than three more nav links.
 */
function ResourceMenuItem({
  child,
  label,
  sub,
}: {
  child: ResourceChild;
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
