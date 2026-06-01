"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
};

/**
 * EN ↔ ZH dropdown. Trigger shows the current locale label compactly;
 * menu items spell out the language name in its native script so a visitor
 * scanning the menu knows which one they're picking.
 *
 * Path is preserved on switch via next-intl's router.replace(...).
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("locale");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onChange = (next: Locale) => {
    if (next === locale) return;
    track("locale_switch", { from: locale, to: next, page: pathname });
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        data-pending={isPending ? true : undefined}
        className={cn(
          "border-border bg-surface text-fg-muted hover:text-fg hover:bg-bg-hover duration-fast inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 transition-colors outline-none",
          "data-[state=open]:bg-bg-hover data-[state=open]:text-fg",
          "data-[pending=true]:opacity-60",
          className,
        )}
      >
        <Globe size={12} aria-hidden />
        <span className="text-xs font-strong">{LABELS[locale]}</span>
        <ChevronDown
          size={11}
          aria-hidden
          className="duration-fast transition-transform data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-40 p-1">
        {routing.locales.map((value) => {
          const isActive = locale === value;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => onChange(value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 text-sm",
                isActive && "text-primary font-strong",
              )}
            >
              <span className="flex-1">{t(value)}</span>
              {isActive && <Check size={12} aria-hidden />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
