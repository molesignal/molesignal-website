import { expect, test } from "@playwright/test";

/**
 * E2E verification for ISSUE-6 (T03 — cost calculator / compare-table number
 * calibration). Drives a real Chromium against the production build and asserts:
 *   - default workload renders the calibrated representative point
 *     (Datadog $7.4k / molesignal $150 / 98% savings — matches lib/cost-formula);
 *   - the disclaimer shows the FIXED pricing snapshot month (not today's date),
 *     the "15-day indexed" wording, and a working external source link;
 *   - hostile / cleared number input never leaks "$NaN" into any result card.
 */

type Locale = {
  path: string;
  name: string;
  snapshotMonth: string; // PRICING_SNAPSHOT = 2026-06-02 → June 2026 / 2026年6月
  sourceLabel: string;
  retentionWording: RegExp;
};

const LOCALES: Locale[] = [
  {
    path: "/why",
    name: "en",
    snapshotMonth: "June 2026",
    sourceLabel: "Datadog public pricing",
    retentionWording: /15-day indexed/i,
  },
  {
    path: "/zh/why",
    name: "zh",
    snapshotMonth: "2026年6月",
    sourceLabel: "Datadog 公开定价",
    retentionWording: /15 天索引/,
  },
];

for (const loc of LOCALES) {
  test.describe(`cost calculator [${loc.name}]`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(loc.path, { waitUntil: "networkidle" });
      // Scroll the calculator into view (it lives under #cost on /why).
      await page
        .getByRole("slider")
        .first()
        .scrollIntoViewIfNeeded()
        .catch(() => {});
    });

    test("renders calibrated default workload (100GB/day, 30d)", async ({
      page,
    }) => {
      // Two sliders present (ingest + retention) — calculator mounted.
      await expect(page.getByRole("slider")).toHaveCount(2);
      // Representative point from lib/cost-formula: $7.4k / $150 / 98%.
      await expect(page.getByText("$7.4k", { exact: true })).toBeVisible();
      await expect(page.getByText("$150", { exact: true })).toBeVisible();
      // savings card shows the percent (EN "98% less" / ZH "少 98%").
      await expect(page.getByText(/98%/).first()).toBeVisible();
    });

    test("disclaimer shows fixed snapshot + 15-day wording + source link", async ({
      page,
    }) => {
      const body = await page.locator("body").innerText();
      expect(body).toContain(loc.snapshotMonth);
      expect(body).toMatch(loc.retentionWording);

      const link = page.getByRole("link", { name: loc.sourceLabel });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        "href",
        "https://www.datadoghq.com/pricing/",
      );
      await expect(link).toHaveAttribute("target", "_blank");
      const rel = (await link.getAttribute("rel")) ?? "";
      expect(rel).toContain("noopener");
    });

    test("no $NaN at slider extremes or on cleared number input", async ({
      page,
    }) => {
      const sliders = page.getByRole("slider");
      // Drive both sliders to their min and max via keyboard (Home/End).
      for (let i = 0; i < 2; i++) {
        const s = sliders.nth(i);
        await s.focus();
        await s.press("Home");
        await s.press("End");
      }
      // Force hostile values directly on the React-controlled range inputs and
      // dispatch input events (covers cleared / non-finite mobile entry paths).
      await page.evaluate(() => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )!.set!;
        document
          .querySelectorAll<HTMLInputElement>('input[type="number"]')
          .forEach((el) => {
            for (const v of ["", "abc", "1e", "-50"]) {
              setter.call(el, v);
              el.dispatchEvent(new Event("input", { bubbles: true }));
            }
          });
      });
      const body = await page.locator("body").innerText();
      expect(body).not.toContain("NaN");
      expect(body).not.toContain("$NaN");
      expect(body).not.toContain("Infinity");
    });
  });
}
