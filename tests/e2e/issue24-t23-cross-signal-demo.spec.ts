import { test, expect } from "@playwright/test";

/**
 * ISSUE-24 / T23 — CrossSignalDemo: reduce-motion guard + hardcoded sample.
 *
 * Decision (default, recorded in components/cross-signal-demo.tsx): there is no
 * real/sandbox query backend to wire to (the query engine is a separate
 * cross-project product; this is the marketing site's illustrative demo), so we
 * keep the hardcoded sample. This suite *locks* the two things the acceptance
 * cares about:
 *
 *   1. The demo's single contract — "one trace_id, three views" — holds: the
 *      same `trace_id` (abc123) is woven into Trace, Logs and Metric.
 *   2. The `prefers-reduced-motion` guard is preserved: under reduce the
 *      auto-tour is skipped (tab stays on Trace); under no-preference the
 *      auto-tour actually advances (proving the guard is the live gate, not
 *      dead code), and a user interaction cancels it.
 *
 * Runs against `next start` (production build) per playwright.config.ts. NB:
 * the global config sets contextOptions.reducedMotion = "reduce", so the
 * auto-tour describe block opts back into "no-preference" explicitly.
 */

const TRACE_ID = "abc123";
const AUTO_INTERVAL_MS = 2600; // mirrors AUTO_INTERVAL_MS in the component

const demo = (page: import("@playwright/test").Page) =>
  page.getByTestId("cross-signal-demo");

// ---------------------------------------------------------------------------
// 1. Hardcoded sample — one trace_id consistently present across all 3 views
// ---------------------------------------------------------------------------
test("one trace_id is consistent across Trace / Logs / Metric views", async ({
  page,
}) => {
  await page.goto("/");
  const card = demo(page);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();

  const tablist = card.getByRole("tablist", { name: "Signal view" });
  await expect(tablist.getByRole("tab")).toHaveCount(3);

  // Footer always pins the trace_id literal — the demo's standing claim.
  await expect(card.getByText(`trace_id=${TRACE_ID}`)).toBeVisible();

  // Each view must carry the same id (view occurrence(s) + footer ⇒ ≥ 2).
  for (const name of ["Trace", "Logs", "Metric"]) {
    await tablist.getByRole("tab", { name }).click();
    await expect(tablist.getByRole("tab", { name })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const hits = await card.getByText(TRACE_ID, { exact: false }).count();
    expect(hits, `trace_id present in ${name} view + footer`).toBeGreaterThanOrEqual(2);
  }
});

// ---------------------------------------------------------------------------
// 2. reduce-motion guard — auto-tour skipped (suite default = reduce)
// ---------------------------------------------------------------------------
test("prefers-reduced-motion: auto-tour is skipped, stays on Trace", async ({
  page,
}) => {
  await page.goto("/");
  const tablist = demo(page).getByRole("tablist", { name: "Signal view" });
  const trace = tablist.getByRole("tab", { name: "Trace" });
  const logs = tablist.getByRole("tab", { name: "Logs" });

  await expect(trace).toHaveAttribute("aria-selected", "true");

  // Wait well past one auto-tour interval — with reduce the tour never fires.
  await page.waitForTimeout(AUTO_INTERVAL_MS + 800);

  await expect(trace).toHaveAttribute("aria-selected", "true");
  await expect(logs).toHaveAttribute("aria-selected", "false");
});

// ---------------------------------------------------------------------------
// 3. Without reduce-motion the auto-tour DOES run (guard is the live gate)
//    and a user interaction cancels it.
// ---------------------------------------------------------------------------
test.describe("auto-tour (motion allowed)", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("auto-tour advances Trace → Logs on its own", async ({ page }) => {
    await page.goto("/");
    const tablist = demo(page).getByRole("tablist", { name: "Signal view" });
    const trace = tablist.getByRole("tab", { name: "Trace" });
    const logs = tablist.getByRole("tab", { name: "Logs" });

    await expect(trace).toHaveAttribute("aria-selected", "true");
    // One interval later the tour should have moved to Logs.
    await expect(logs).toHaveAttribute("aria-selected", "true", {
      timeout: AUTO_INTERVAL_MS + 4000,
    });
  });

  test("user interaction cancels the auto-tour", async ({ page }) => {
    await page.goto("/");
    const tablist = demo(page).getByRole("tablist", { name: "Signal view" });
    const metric = tablist.getByRole("tab", { name: "Metric" });

    await metric.click();
    await expect(metric).toHaveAttribute("aria-selected", "true");

    // Past two more intervals: had the tour kept running it would have left
    // Metric. Interaction must have cancelled it — Metric stays selected.
    await page.waitForTimeout(AUTO_INTERVAL_MS * 2 + 600);
    await expect(metric).toHaveAttribute("aria-selected", "true");
  });
});
