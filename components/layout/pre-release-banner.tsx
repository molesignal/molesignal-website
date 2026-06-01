"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "molesignal-prerelease-banner-dismissed";
const TTL_DAYS = 7;

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number.parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    const ageMs = Date.now() - ts;
    return ageMs < TTL_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Top-of-page banner announcing the pre-1.0 status. Dismissal persists for
 * 7 days via localStorage. Renders null until mount to avoid SSR/CSR flicker.
 */
export function PreReleaseBanner({ className }: { className?: string }) {
  const t = useTranslations("banner");
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHidden(isDismissed());
  }, []);

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* localStorage disabled — accept session-only dismissal */
    }
  };

  if (!mounted || hidden) return null;

  return (
    <div
      role="region"
      aria-label="Pre-release announcement"
      className={cn(
        "bg-primary-bg text-fg relative flex h-banner items-center justify-center px-12 text-xs font-strong",
        className,
      )}
    >
      <Link
        href="/design-partner"
        data-analytics-event="cta_click"
        data-analytics-source-page
        data-analytics-props='{"label":"Pre-release banner","destination":"/design-partner"}'
        className="hover:text-primary group inline-flex items-center gap-1.5 transition-colors"
      >
        <span className="truncate">{t("preRelease")}</span>
        <span
          aria-hidden
          className="text-marketing-accent duration-fast inline-block transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="hover:bg-bg-hover text-fg-muted hover:text-fg duration-fast absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded transition-colors"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
