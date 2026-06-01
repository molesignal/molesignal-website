import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge ships with a default theme that only knows Tailwind's stock
 * scales. It has no idea about the custom design tokens declared in
 * `app/globals.css`, so several of them fall through to the WRONG conflict
 * group and silently drop a class that should have survived:
 *
 *  - Custom font WEIGHTS (`--font-weight-*`: font-strong, font-body, font-ui,
 *    font-mono-strong, font-display, font-display-strong) match the catch-all
 *    `font-family` group, so `cn("font-mono font-strong")` collapsed to just
 *    `font-strong` — losing the monospace family (ISSUE-11 DEF-1).
 *  - Custom text SIZES (`--text-display-*`, `--text-mono-*`) match the
 *    text-COLOR group, so `cn("text-display-lg ...", "text-amber")` dropped
 *    `text-display-lg` — losing the display size on the cost calculator's
 *    savings figure (the "大数" in the AC).
 *
 * Registering these names in the matching theme scales lets tailwind-merge
 * classify them correctly: family + weight + size + color all coexist, while
 * genuine same-group conflicts still de-duplicate (last one wins).
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      "font-weight": [
        "body",
        "ui",
        "mono-strong",
        "strong",
        "display",
        "display-strong",
      ],
      text: [
        "display-sm",
        "display-md",
        "display-lg",
        "display-xl",
        "display-2xl",
        "display-3xl",
        "mono-sm",
        "mono-md",
        "mono-lg",
        "mono-xl",
        "mono-2xl",
        "mono-3xl",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
