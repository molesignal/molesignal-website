"use client";

import { Check, ChevronDown, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ThemeKey = "light" | "dark";

const OPTIONS: Array<{ value: ThemeKey; Icon: typeof Sun; key: ThemeKey }> = [
  { value: "light", Icon: Sun, key: "light" },
  { value: "dark", Icon: Moon, key: "dark" },
];

/**
 * Light/Dark dropdown. Trigger shows the icon of the currently resolved
 * theme so the chrome reads as a status, not a question.
 *
 * The underlying provider still accepts "system" — first-time visitors
 * (no localStorage) fall through the anti-flash script to OS preference.
 * The toggle itself only offers explicit Light / Dark choices.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        aria-hidden
        className={cn(
          "border-border h-8 w-[60px] rounded-md border",
          className,
        )}
      />
    );
  }

  const active = (resolvedTheme ?? theme ?? "light") as ThemeKey;
  const ActiveIcon = active === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        className={cn(
          "border-border bg-surface text-fg-muted hover:text-fg hover:bg-bg-hover duration-fast inline-flex h-8 items-center gap-1 rounded-md border px-2 transition-colors outline-none",
          "data-[state=open]:bg-bg-hover data-[state=open]:text-fg",
          className,
        )}
      >
        <ActiveIcon size={14} aria-hidden />
        <ChevronDown
          size={11}
          aria-hidden
          className="duration-fast transition-transform data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-32 p-1">
        {OPTIONS.map(({ value, Icon, key }) => {
          const isActive = active === value;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => {
                track("theme_switch", { theme: value });
                setTheme(value);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2 text-sm",
                isActive && "text-primary font-strong",
              )}
            >
              <Icon size={14} aria-hidden />
              <span className="flex-1">{t(key)}</span>
              {isActive && <Check size={12} aria-hidden />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
