import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const pillVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-strong uppercase tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-surface-muted text-fg-muted",
        brand: "bg-primary-bg text-primary",
        marketing:
          "bg-marketing-accent-dim text-marketing-accent",
        success: "bg-green-dim text-green",
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
 *   - changelog `feat` / `fix` / `breaking`
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
