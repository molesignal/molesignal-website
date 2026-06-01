"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Floating "back to top" button. Appears once the user has scrolled past
 * 800px. Smooth-scrolls on click (auto-scrolls under prefers-reduced-motion,
 * which the global CSS already coerces via scroll-behavior).
 */
export function ScrollToTop({ className }: { className?: string }) {
  const t = useTranslations("components.scrollToTop");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = () => {
    window.scrollTo({ top: 0 });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("label")}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "border-border bg-surface text-fg hover:border-primary hover:shadow-glow-indigo duration-fast fixed right-6 bottom-6 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-md transition-all",
        visible
          ? "opacity-100 translate-y-0"
          : "pointer-events-none translate-y-2 opacity-0",
        className,
      )}
    >
      <ArrowUp size={16} aria-hidden />
    </button>
  );
}
