import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PaddingSize = "sm" | "md" | "lg" | "xl" | "none";
type Tint = "none" | "surface" | "muted" | "hero" | "dotted";

const PADDING_MAP: Record<PaddingSize, string> = {
  none: "",
  sm: "py-section-sm",
  md: "py-section-md",
  lg: "py-section-lg",
  xl: "py-section-xl",
};

const TINT_MAP: Record<Tint, string> = {
  none: "",
  surface: "bg-surface",
  muted: "bg-surface-muted",
  hero: "bg-marketing-hero",
  // Dotted background uses inline style for now — see globals.css for the var
  dotted:
    "[background-image:radial-gradient(var(--bd-0)_1px,transparent_1px)] [background-size:24px_24px]",
};

export type SectionProps = HTMLAttributes<HTMLElement> & {
  /** Top/bottom padding scale. `md` (5rem) is the default. */
  padding?: PaddingSize;
  /** Background tint. `none` keeps the parent background. */
  tint?: Tint;
  /** Polymorphic element. Defaults to `<section>`. */
  as?: ElementType;
  /** When true, content is wrapped in the inner `page-container` (max-w + px). */
  contain?: boolean;
};

/**
 * The repeating "marketing section" primitive — vertical padding scale,
 * optional tint background, optional `page-container` inner wrapper.
 *
 *   <Section padding="lg" tint="surface" contain>
 *     <h2>...</h2>
 *   </Section>
 */
export function Section({
  padding = "md",
  tint = "none",
  as: Tag = "section",
  contain = true,
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <Tag
      className={cn(PADDING_MAP[padding], TINT_MAP[tint], className)}
      {...rest}
    >
      {contain ? <div className="page-container">{children}</div> : children}
    </Tag>
  );
}
