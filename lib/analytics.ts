/**
 * Thin analytics wrapper. Today only Plausible — but the wrapper exists so
 * call sites don't have to depend on the global, and so a future provider
 * swap stays mechanical.
 *
 * Event names are snake_case (verb-object), per 06§4.4 — the single source of
 * truth for the conversion-funnel taxonomy. Keep call sites consistent with
 * that table; a stray kebab-case name silently splits the funnel in Plausible.
 *
 * Usage:
 *   import { track } from "@/lib/analytics";
 *   track("cta_click", { label: "Try it", source_page: "/", destination: "/start" });
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
