import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const pillVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-strong uppercase tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        // 05-UI §3.6 — Pill semantic variants on the migrated teal/amber palette.
        default: "bg-surface-muted text-fg-muted",
        brand: "border border-brand/20 bg-brand-dim text-brand",
        amber: "bg-amber-dim text-amber",
        success: "bg-green-dim text-green",
        danger: "bg-red-dim text-red",
        muted: "bg-surface-muted text-fg-muted",
        // `marketing` (amber accent) and `warning` (red) kept as back-compat
        // aliases for existing call sites; prefer `amber` / `danger` going forward.
        marketing: "bg-marketing-accent-dim text-marketing-accent",
        warning: "bg-red-dim text-red",
        outline: "border-border text-fg-muted border",
      },
      size: {
        default: "h-[18px] px-2 text-[10px]",
        sm: "h-[16px] px-1.5 text-[9px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type PillProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pillVariants>;

/**
 * Compact uppercase tag. Used for:
 *   - `pre-1.0` callout label
 *   - roadmap `now` / `next` / `later` / `done`
 *
 * Different from shadcn's Badge: Pill is denser, all-caps, and uses our
 * marketing accent for the brand variant. Use Badge for general-purpose
 * status chips.
 */
export function Pill({ variant, size, className, ...rest }: PillProps) {
  return (
    <span className={cn(pillVariants({ variant, size }), className)} {...rest} />
  );
}
