/**
 * Thin analytics wrapper. Today only Plausible — but the wrapper exists so
 * call sites don't have to depend on the global, and so a future provider
 * swap stays mechanical.
 *
 * Usage:
 *   import { track } from "@/lib/analytics";
 *   track("cta-click", { surface: "hero", target: "/start" });
 */

type Plausible = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

declare global {
  interface Window {
    plausible?: Plausible & { q?: unknown[] };
  }
}

export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;
  if (!window.plausible) return;
  try {
    window.plausible(event, props ? { props } : undefined);
  } catch {
    /* analytics must never break the page */
  }
}
