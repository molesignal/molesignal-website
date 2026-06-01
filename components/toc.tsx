"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type TocItem = {
  id: string;
  label: string;
  level?: 2 | 3;
};

/**
 * Sticky table of contents. Desktop shows a right-side rail; mobile collapses
 * into a horizontal scroll of anchor pills.
 *
 * Items can be passed explicitly OR auto-extracted from the page's H2/H3
 * after mount (see `autoExtract`).
 *
 * Active state follows IntersectionObserver: whichever section's heading is
 * closest to the top of the viewport gets highlighted.
 */
export function Toc({
  items: itemsProp,
  autoExtract = false,
  className,
}: {
  items?: TocItem[];
  autoExtract?: boolean;
  className?: string;
}) {
  const t = useTranslations("components.toc");
  const [items, setItems] = useState<TocItem[]>(itemsProp ?? []);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Auto-extract H2/H3 if requested
  useEffect(() => {
    if (!autoExtract || itemsProp) return;
    const main = document.getElementById("main");
    if (!main) return;
    const headings = main.querySelectorAll("h2[id], h3[id]");
    const extracted: TocItem[] = Array.from(headings).map((h) => ({
      id: h.id,
      label: h.textContent ?? "",
      level: h.tagName === "H3" ? 3 : 2,
    }));
    setItems(extracted);
  }, [autoExtract, itemsProp]);

  // Highlight active section
  useEffect(() => {
    if (items.length === 0) return;
    const elements = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => !!el);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-96px 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label={t("label")}
        className={cn(
          "sticky top-[calc(var(--nav-h)+var(--banner-h))] hidden lg:block",
          "max-h-[calc(100vh-var(--nav-h)-var(--banner-h)-2rem)] overflow-y-auto",
          className,
        )}
      >
        <p className="text-fg-muted mb-3 text-xs font-strong uppercase tracking-wide">
          {t("label")}
        </p>
        <ul className="space-y-1.5 text-sm">
          {items.map((it) => {
            const isActive = activeId === it.id;
            return (
              <li
                key={it.id}
                className={cn(it.level === 3 && "pl-3")}
              >
                <a
                  href={`#${it.id}`}
                  className={cn(
                    "block leading-tight transition-colors duration-fast",
                    isActive
                      ? "text-primary font-strong"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {it.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile horizontal pills */}
      <nav
        aria-label={t("labelMobile")}
        className="border-border bg-bg/95 sticky top-[calc(var(--nav-h)+var(--banner-h))] z-20 -mx-6 mb-4 overflow-x-auto border-y px-6 py-2 backdrop-blur lg:hidden"
      >
        <ul className="flex w-max gap-1.5">
          {items.map((it) => {
            const isActive = activeId === it.id;
            return (
              <li key={it.id} className="shrink-0">
                <a
                  href={`#${it.id}`}
                  className={cn(
                    "border-border bg-surface inline-flex h-7 items-center rounded-full border px-3 text-xs whitespace-nowrap transition-colors duration-fast",
                    isActive
                      ? "border-primary text-primary font-strong"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {it.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
