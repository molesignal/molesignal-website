import { expect, test, type Page } from "@playwright/test";

/**
 * ISSUE-11 / T10 — form pages + cost/compare visual redesign regression.
 *
 * Verifies the acceptance criteria against the real production render
 * (next start). The central risk (same family as ISSUE-10) is that brand /
 * amber background tokens compile to NOTHING and the redesigned cards render
 * with no fill — so every colour assertion reads the *computed* style and
 * proves the background is a real, non-transparent colour, not just that a
 * class name is present.
 *
 *   AC1 CostCalculator (/why): three result cards carry semantic colours
 *       (Datadog=red, molesignal=brand teal w/ REAL bg, Savings=amber); the
 *       Savings value is amber + monospace; the range slider is >=44px tall.
 *   AC2 CompareTable (/why, /): molesignal column header has a 3px brand top
 *       border + real brand tint; verdict markers are literal mono ✓ / ✗ / ~.
 *   AC3 CloudWaitlistForm (/cloud): success → persistent GREEN card w/ check
 *       icon; HTTP 429 → gentle AMBER notice (not a red error), form retained.
 *   AC4 DesignPartnerForm (/design-partner): success → green card; 429 → amber
 *       inline notice keeping the filled form.
 *   AC5 Design-Partner "what happens after": 3 steps, each with a mono brand
 *       number badge that has a REAL brand-tint fill.
 */

const ROOT = ""; // default locale (en) is served at the site root

// ---- helpers ---------------------------------------------------------------

/**
 * Resolve a computed CSS colour property to straight sRGB [r,g,b,a] in the
 * browser via a 1x1 canvas. Tailwind v4 emits modern `oklab()/oklch()` colour
 * functions which a naive `rgb()` regex can't parse — painting onto a canvas
 * lets Chromium do the conversion for us, so the assertions stay format-proof.
 */
async function readColor(
  locator: import("@playwright/test").Locator,
  prop: "backgroundColor" | "borderTopColor" | "borderLeftColor" | "color",
): Promise<[number, number, number, number]> {
  return locator.evaluate((el, p) => {
    const raw = getComputedStyle(el)[p as keyof CSSStyleDeclaration] as string;
    const cvs = document.createElement("canvas");
    cvs.width = cvs.height = 1;
    const ctx = cvs.getContext("2d")!;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255] as [number, number, number, number];
  }, prop);
}
/** A fill that actually paints something (non-transparent). */
function isPainted(rgba: [number, number, number, number]): boolean {
  return rgba[3] > 0.001;
}

// ---------------------------------------------------------------------------
// AC1 — Cost calculator result cards + slider (/why)
// ---------------------------------------------------------------------------
test.describe("[en] T10 cost calculator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ROOT}/why`);
    await page.waitForLoadState("networkidle");
  });

  test("AC1 — three result cards carry semantic colours; brand card has a REAL bg", async ({
    page,
  }) => {
    // brand "molesignal" card — the ISSUE-10/11 regression target. Must have a
    // painted background (border-primary/30 bg-primary/10), not compile to nothing.
    const brandCard = page.locator(".bg-primary\\/10").first();
    await expect(brandCard).toBeVisible();
    expect(isPainted(await readColor(brandCard, "backgroundColor"))).toBe(true);
    expect(isPainted(await readColor(brandCard, "borderTopColor"))).toBe(true);

    // Datadog card = red tint
    const redCard = page.locator(".bg-red-dim").first();
    await expect(redCard).toBeVisible();
    expect(isPainted(await readColor(redCard, "backgroundColor"))).toBe(true);

    // Savings card = amber tint
    const amberCard = page.locator(".bg-amber-dim").first();
    await expect(amberCard).toBeVisible();
    expect(isPainted(await readColor(amberCard, "backgroundColor"))).toBe(true);
  });

  test("AC1 — Savings big number is amber + monospace", async ({ page }) => {
    // The amber-toned value div inside the savings card: text-amber font-mono.
    const savingsValue = page
      .locator(".text-amber.font-mono")
      .first();
    await expect(savingsValue).toBeVisible();
    const ff = await savingsValue.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(ff.toLowerCase()).toMatch(/mono/);
    // amber: warm colour — red channel dominates blue
    const [r, g, b] = await readColor(savingsValue, "color");
    expect(r).toBeGreaterThan(b);
    expect(g).toBeGreaterThan(b);
  });

  test("AC1 — range slider has a >=44px touch target (WCAG 2.5.5)", async ({
    page,
  }) => {
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

// ---------------------------------------------------------------------------
// AC2 — Compare table brand top border + mono verdict glyphs
// ---------------------------------------------------------------------------
for (const path of [`${ROOT}/why`, `${ROOT}/`]) {
  test.describe(`[en] T10 compare table @ ${path || "/"}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    });

    test("AC2 — molesignal column header has a 3px brand top border + real tint", async ({
      page,
    }) => {
      const header = page.locator("th.border-t-brand").first();
      await expect(header).toBeVisible();
      const topWidth = await header.evaluate(
        (el) => getComputedStyle(el).borderTopWidth,
      );
      expect(parseFloat(topWidth)).toBeGreaterThanOrEqual(3);
      expect(isPainted(await readColor(header, "borderTopColor"))).toBe(true);
      expect(isPainted(await readColor(header, "backgroundColor"))).toBe(true); // bg-primary/10 paints
    });

    test("AC2 — verdict markers are literal monospace ✓ / ✗ / ~ glyphs", async ({
      page,
    }) => {
      // Target the leaf glyph span (font-mono) directly — a bare getByText("✓")
      // can also match an empty-value wrapper whose text collapses to just "✓".
      const good = page.locator("span.font-mono").filter({ hasText: "✓" }).first();
      await expect(good).toBeVisible();
      const ff = await good.evaluate((el) => getComputedStyle(el).fontFamily);
      expect(ff.toLowerCase()).toMatch(/mono/);
      // and a ✗ marker exists somewhere in the table, also mono
      await expect(
        page.locator("span.font-mono").filter({ hasText: "✗" }).first(),
      ).toBeVisible();
    });
  });
}

// ---------------------------------------------------------------------------
// AC3 — Cloud waitlist form success + rate-limit states (/cloud)
// ---------------------------------------------------------------------------
test.describe("[en] T10 cloud waitlist form states", () => {
  test("AC3 — 2xx → persistent green success card", async ({ page }) => {
    await page.route("**/api/cloud-waitlist", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );
    await page.goto(`${ROOT}/cloud`);
    await page.waitForLoadState("networkidle");

    await page.fill("#cw-email", "qa-issue11@example.com");
    await page.locator("#cw-email").press("Enter");

    const card = page.locator('[role="status"].bg-green-dim').first();
    await expect(card).toBeVisible();
    // real green fill + a check icon present
    expect(isPainted(await readColor(card, "backgroundColor"))).toBe(true);
    await expect(card.locator("svg").first()).toBeVisible();
  });

  test("AC3 — 429 → gentle amber notice, form NOT replaced", async ({ page }) => {
    await page.route("**/api/cloud-waitlist", (route) =>
      route.fulfill({ status: 429, contentType: "application/json", body: "{}" }),
    );
    await page.goto(`${ROOT}/cloud`);
    await page.waitForLoadState("networkidle");

    await page.fill("#cw-email", "qa-issue11@example.com");
    await page.locator("#cw-email").press("Enter");

    const notice = page.locator('[role="status"].bg-amber-dim').first();
    await expect(notice).toBeVisible();
    const borderLeft = await notice.evaluate(
      (el) => getComputedStyle(el).borderLeftWidth,
    );
    expect(isPainted(await readColor(notice, "backgroundColor"))).toBe(true);
    expect(parseFloat(borderLeft)).toBeGreaterThanOrEqual(3); // left amber accent bar
    // amber, not red: green channel must be meaningfully present (red error would be ~0 green)
    const [r, g, b] = await readColor(notice, "borderLeftColor");
    expect(g).toBeGreaterThan(b);
    expect(r).toBeGreaterThan(b);
    // form retained → email field still there
    await expect(page.locator("#cw-email")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC4 — Design-partner form success + rate-limit states (/design-partner)
// ---------------------------------------------------------------------------
async function fillDpForm(page: Page) {
  await page.fill("#dp-name", "QA Issue11");
  await page.fill("#dp-email", "qa-issue11@example.com");
  await page.selectOption("#dp-size", "11-50");
  await page.selectOption("#dp-stack", "Datadog");
  await page.fill("#dp-pain", "Datadog bill is out of control.");
}

test.describe("[en] T10 design-partner form states", () => {
  test("AC4 — 2xx → green success card", async ({ page }) => {
    await page.route("**/api/design-partner", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );
    await page.goto(`${ROOT}/design-partner`);
    await page.waitForLoadState("networkidle");

    await fillDpForm(page);
    // Scope to the DP form's own submit (the page footer has a separate
    // waitlist form + button — `.last()` would click that instead).
    await page.locator('form:has(#dp-name) button[type="submit"]').click();

    const card = page.locator('[role="status"].bg-green-dim').first();
    await expect(card).toBeVisible();
    expect(isPainted(await readColor(card, "backgroundColor"))).toBe(true);
    await expect(card.locator("svg").first()).toBeVisible();
  });

  test("AC4 — 429 → amber notice keeps the filled form", async ({ page }) => {
    await page.route("**/api/design-partner", (route) =>
      route.fulfill({ status: 429, contentType: "application/json", body: "{}" }),
    );
    await page.goto(`${ROOT}/design-partner`);
    await page.waitForLoadState("networkidle");

    await fillDpForm(page);
    await page.locator('form:has(#dp-name) button[type="submit"]').click();

    const notice = page.locator('[role="status"].bg-amber-dim').first();
    await expect(notice).toBeVisible();
    expect(isPainted(await readColor(notice, "backgroundColor"))).toBe(true);
    // filled form preserved — name still holds the typed value
    await expect(page.locator("#dp-name")).toHaveValue("QA Issue11");
  });
});

// ---------------------------------------------------------------------------
// AC5 — Design-partner "what happens after" 3-step badges
// ---------------------------------------------------------------------------
test.describe("[en] T10 design-partner steps", () => {
  test("AC5 — three mono brand step badges with real brand tint", async ({
    page,
  }) => {
    await page.goto(`${ROOT}/design-partner`);
    await page.waitForLoadState("networkidle");

    // Step badges: rounded brand-tint circles with mono numbers.
    const badges = page.locator("ol li > span.bg-primary\\/10");
    await expect(badges).toHaveCount(3);
    const first = badges.first();
    const ff = await first.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(isPainted(await readColor(first, "backgroundColor"))).toBe(true);
    expect(ff.toLowerCase()).toMatch(/mono/);
    await expect(first).toHaveText("1");
  });
});
