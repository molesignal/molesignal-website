import { expect, test } from "@playwright/test";

import { COMPARE_ROWS } from "../../lib/compare-data";

/**
 * ISSUE-23 / T22 — CompareTable dynamic data source.
 *
 * Proves the slim/full behaviour is driven entirely by COMPARE_ROWS (the single
 * data source), with NO hard-coded row counts. Expected counts are derived from
 * the source array at runtime, so adding/removing a row never silently breaks
 * this assertion — the test moves with the data.
 *
 *   AC4 slim (Home /): renders exactly the first 4 rows (COMPARE_ROWS.slice(0,4))
 *       and a `compare_table_expand` CTA whose href targets /why#compare;
 *   AC4 full (/why):  renders ALL COMPARE_ROWS rows.
 *
 * The compare table is the only <table> on either page, so `table tbody tr`
 * counts compare rows directly. The desktop table is the visible layout at the
 * default Desktop-Chrome viewport (mobile cards are `md:hidden`).
 */

const SLIM_EXPECTED = Math.min(4, COMPARE_ROWS.length);
const FULL_EXPECTED = COMPARE_ROWS.length;

test.describe("[en] T22 CompareTable dynamic rows", () => {
  test("AC4 — slim (Home) renders the first 4 rows + a /why#compare CTA", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Desktop table body rows == the slim slice, derived from the data source.
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(SLIM_EXPECTED);

    // The "see full comparison" CTA is the analytics-tagged expand link and
    // must deep-link to the full table anchor on /why.
    const cta = page.locator('a[data-analytics-event="compare_table_expand"]');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /\/why#compare$/);
  });

  test("AC4 — full (/why) renders every COMPARE_ROWS row", async ({ page }) => {
    await page.goto("/why");
    await page.waitForLoadState("networkidle");

    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(FULL_EXPECTED);

    // Full view is the canonical comparison — no slim CTA back to itself.
    await expect(
      page.locator('a[data-analytics-event="compare_table_expand"]'),
    ).toHaveCount(0);
  });
});
