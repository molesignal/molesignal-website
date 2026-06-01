import { expect, test } from "@playwright/test";

/**
 * ISSUE-10 / T09 — core-page visual redesign regression.
 *
 * Verifies the 6 acceptance criteria from the issue against the real
 * production render (next start):
 *   1. Hero: left-aligned (max-w-4xl), brand-color highlight (text-primary,
 *      no gradient), mono `$ …` command subtitle.
 *   2. Hero: real `docker compose …` command preview rendered.
 *   3. Cross-signal demo: terminal card with 3 chrome dots + amber trace_id +
 *      3px brand active-tab underline.
 *   4. Why/Stats: large GitHub stats chip number is mono + brand
 *      (font-mono / text-mono-2xl / text-primary).
 *   5. Design-Partner CTA: left-border accent card (border-l-primary),
 *      NO shadow-glow-pink / gradient.
 *   6. Light + dark both render (no broken/invisible content).
 *
 * Runs for both locales.
 */

const DOCKER_LINE =
  "docker compose -f deploy/docker/docker-compose.yaml --profile standalone up";

const LOCALES = [
  {
    locale: "en",
    command: "self-hosted · OpenTelemetry-native · logs + metrics + traces",
    highlight: "Without the Datadog bill.",
    startPill: "5 minutes",
  },
  {
    locale: "zh",
    command: "自托管 · OpenTelemetry 原生 · 日志 + 指标 + 链路",
    highlight: "但不必付 Datadog 的账单。",
    startPill: "5 分钟",
  },
] as const;

for (const L of LOCALES) {
  test.describe(`[${L.locale}] T09 home visual`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/${L.locale}`);
      await page.waitForLoadState("networkidle");
    });

    test("AC1 — Hero left-aligned, brand highlight, mono $ subtitle", async ({
      page,
    }) => {
      // left-aligned hero container
      const heroBox = page.locator("section .max-w-4xl").first();
      await expect(heroBox).toBeVisible();

      // highlight is brand color (text-primary), NOT a gradient clip
      const highlight = page.getByText(L.highlight, { exact: false }).first();
      await expect(highlight).toBeVisible();
      await expect(highlight).toHaveClass(/text-primary/);
      const bgImage = await highlight.evaluate(
        (el) => getComputedStyle(el).backgroundImage,
      );
      expect(bgImage).toBe("none"); // no gradient text

      // mono `$ <command>` subtitle
      const subtitle = page.locator("p.font-mono", { hasText: L.command }).first();
      await expect(subtitle).toBeVisible();
      const fontFamily = await subtitle.evaluate(
        (el) => getComputedStyle(el).fontFamily,
      );
      expect(fontFamily.toLowerCase()).toMatch(/mono/);
      await expect(subtitle.getByText("$", { exact: true })).toHaveClass(
        /text-primary/,
      );
    });

    test("AC2 — real docker compose command preview present", async ({
      page,
    }) => {
      await expect(
        page.getByText(DOCKER_LINE, { exact: false }).first(),
      ).toBeVisible();
    });

    test("AC3 — demo terminal card: 3 chrome dots + amber trace_id + 3px underline", async ({
      page,
    }) => {
      // 3 chrome dots (red / amber / green)
      await expect(page.locator(".bg-red\\/70")).toHaveCount(1);
      await expect(page.locator(".bg-marketing-accent\\/70")).toHaveCount(1);
      await expect(page.locator(".bg-green\\/70")).toHaveCount(1);

      // amber-highlighted trace_id chip (footer caption is always present)
      const traceChip = page
        .locator("code", { hasText: "trace_id" })
        .first();
      await expect(traceChip).toBeVisible();
      const color = await traceChip.evaluate(
        (el) => getComputedStyle(el).color,
      );
      // marketing-accent is amber — assert it's not the default fg by checking
      // it resolves to a warm (R>G>B-ish amber) value, i.e. red & green high, blue low.
      const m = color.match(/rgba?\(([^)]+)\)/);
      expect(m).not.toBeNull();
      const [r, g, b] = m![1].split(",").map((n) => parseFloat(n));
      expect(r).toBeGreaterThan(b); // amber: red channel dominates blue
      expect(g).toBeGreaterThan(b);

      // active tab 3px brand underline
      const underline = page.locator(".bg-primary.h-\\[3px\\]");
      await expect(underline.first()).toBeVisible();
    });

    test("AC4 — large stats chip number is mono + brand", async ({ page }) => {
      // the large stats chip lives in the stats section; its number span is
      // font-mono text-mono-2xl text-primary
      const statNum = page.locator("span.text-primary.font-mono.text-mono-2xl");
      await expect(statNum.first()).toBeVisible();
      const ff = await statNum
        .first()
        .evaluate((el) => getComputedStyle(el).fontFamily);
      expect(ff.toLowerCase()).toMatch(/mono/);
    });

    test("AC5 — DP CTA is left-border accent card, no glow", async ({
      page,
    }) => {
      const dpCard = page.locator(".border-l-primary").first();
      await expect(dpCard).toBeVisible();
      // left border is 4px and a non-transparent brand color
      const styles = await dpCard.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          leftWidth: s.borderLeftWidth,
          leftColor: s.borderLeftColor,
          boxShadow: s.boxShadow,
        };
      });
      expect(parseFloat(styles.leftWidth)).toBeGreaterThanOrEqual(3);
      expect(styles.leftColor).not.toBe("rgba(0, 0, 0, 0)");
      // no pink glow shadow
      expect(styles.boxShadow.toLowerCase()).not.toContain("236, 72"); // pink-ish rgb
      // 5-minute brand pill present in start section
      await expect(
        page.getByText(L.startPill, { exact: false }).first(),
      ).toBeVisible();
    });

    test("AC6 — dark theme renders hero + DP card (content visible)", async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      });
      await expect(
        page.getByText(L.highlight, { exact: false }).first(),
      ).toBeVisible();
      await expect(page.locator(".border-l-primary").first()).toBeVisible();
      // hero subtitle still visible & has non-zero text color
      const subtitle = page
        .locator("p.font-mono", { hasText: L.command })
        .first();
      await expect(subtitle).toBeVisible();
      const color = await subtitle.evaluate(
        (el) => getComputedStyle(el).color,
      );
      expect(color).not.toBe("rgba(0, 0, 0, 0)");
    });
  });
}
