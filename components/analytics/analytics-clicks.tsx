"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics";

/**
 * Delegated click tracker for funnel events that live on server-rendered
 * links/buttons (CTAs, the compare-table expand link, GitHub star links).
 * Those elements can't call `track()` themselves without becoming client
 * components, so instead they carry data attributes and this single mounted
 * listener reads them on click:
 *
 *   data-analytics-event="cta_click"          → the event name to emit
 *   data-analytics-props='{"label":"Try it"}' → static props (JSON object)
 *   data-analytics-source-page                 → inject the live pathname as
 *                                                `source_page` at click time
 *
 * Listens in the capture phase so the event fires before Next.js Link's own
 * click handler navigates away. `track()` is a safe no-op when Plausible
 * isn't loaded, so this is inert locally / without a domain.
 */
export function AnalyticsClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest<HTMLElement>("[data-analytics-event]");
      if (!el) return;

      const event = el.dataset.analyticsEvent;
      if (!event) return;

      let props: Record<string, string | number | boolean> | undefined;
      const raw = el.dataset.analyticsProps;
      if (raw) {
        try {
          props = JSON.parse(raw);
        } catch {
          /* malformed props attribute — emit the event without them */
        }
      }
      if (el.hasAttribute("data-analytics-source-page")) {
        props = { ...(props ?? {}), source_page: window.location.pathname };
      }

      track(event, props);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () =>
      document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
