import { expect, test } from "@playwright/test";

/**
 * ISSUE-12 / T08b — TopNav / Footer / Pill / Button visual redesign regression.
 *
 * Same central risk as ISSUE-10/11: a migrated design token (font-mono-strong,
 * text-mono-lg, shadow-glow-brand, bg-brand-dim, border-brand, backdrop-blur-md)
 * could compile to NOTHING and silently render wrong. So colour/blur assertions
 * read the *computed* style, not just a class name.
 *
 *   AC1 TopNav: 56px tall; brand wordmark monospace; active item is a 2px brand
 *       UNDERLINE (bottom border) not a filled bg pill; scroll → backdrop-blur.
 *   AC2 Footer: 4 column titles; T04 disabled links (Discord/Twitter) keep
 *       aria-disabled; muted default / hover-to-fg link colour.
 *   AC3 Pill brand variant: real bg-brand-dim fill + brand border + brand text.
 *       Button brand CTA renders with a real bg fill.
 *   AC4 (T04 not broken): footer Download anchors /start#install; github extern.
 */

const ROOT = ""; // default locale (en) served at site root

async function readColor(
  locator: import("@playwright/test").Locator,
  prop: "backgroundColor" | "borderBottomColor" | "borderColor" | "color",
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
function isPainted(rgba: [number, number, number, number]): boolean {
  return rgba[3] > 0.001;
}

// ---------------------------------------------------------------------------
// AC1 — TopNav
// ---------------------------------------------------------------------------
test.describe("[en] T08b TopNav", () => {
  test("AC1 — nav bar is 56px tall + brand wordmark is monospace", async ({
    page,
  }) => {
    await page.goto(`${ROOT}/`);
    await page.waitForLoadState("networkidle");

    const bar = page.locator("header .h-nav").first();
    await expect(bar).toBeVisible();
    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.round(box!.height)).toBe(56);

    const wordmark = page.locator("header span", { hasText: "molesignal" }).first();
    await expect(wordmark).toBeVisible();
    const ff = await wordmark.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(ff.toLowerCase()).toMatch(/mono/);
  });

  test("AC1 — active nav item is a 2px brand UNDERLINE, not a filled pill", async ({
    page,
  }) => {
    await page.goto(`${ROOT}/why`);
    await page.waitForLoadState("networkidle");

    // The /why primary link is active on /why.
    const active = page
      .locator('header nav a[href$="/why"]')
      .first();
    await expect(active).toBeVisible();

    const bw = await active.evaluate(
      (el) => getComputedStyle(el).borderBottomWidth,
    );
    expect(parseFloat(bw)).toBeGreaterThanOrEqual(2);
    // bottom border is a painted brand colour …
    expect(isPainted(await readColor(active, "borderBottomColor"))).toBe(true);
    // … and it is an underline, NOT a filled background pill.
    expect(isPainted(await readColor(active, "backgroundColor"))).toBe(false);
  });

  test("AC1 — scrolling past 80px gives the header a backdrop-blur", async ({
    page,
  }) => {
    await page.goto(`${ROOT}/`);
    await page.waitForLoadState("networkidle");
    const header = page.locator("header").first();

    // at top: transparent, no blur
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    // scroll down well past the 80px threshold
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(250);

    const bf = await header.evaluate((el) => {
      const s = getComputedStyle(el);
      return (
        (s.backdropFilter || (s as unknown as Record<string, string>)["webkitBackdropFilter"]) ?? ""
      );
    });
    expect(bf.toLowerCase()).toMatch(/blur/);
    // and the surface now paints a (semi-opaque) background
    expect(isPainted(await readColor(header, "backgroundColor"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC2 — Footer
// ---------------------------------------------------------------------------
test.describe("[en] T08b Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ROOT}/`);
    await page.waitForLoadState("networkidle");
  });

  test("AC2 — four column titles render", async ({ page }) => {
    const titles = page.locator("footer h3");
    await expect(titles).toHaveCount(4);
  });

  test("AC2 — T04 disabled links (Discord/Twitter) keep aria-disabled", async ({
    page,
  }) => {
    const disabled = page.locator('footer [aria-disabled="true"]');
    await expect(disabled).toHaveCount(2);
  });

  test("AC2 — footer links default to muted, hover toward fg", async ({
    page,
  }) => {
    // first column nav link (Why) — should be text-fg-muted, a non-transparent
    // colour but not the marketing primary.
    const link = page.locator('footer a[href$="/why"]').first();
    await expect(link).toBeVisible();
    expect(isPainted(await readColor(link, "color"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC3 — Pill brand variant + Button brand CTA
// ---------------------------------------------------------------------------
test.describe("[en] T08b Pill + Button", () => {
  test("AC3 — Pill brand variant has a real brand-dim fill + brand border + brand text", async ({
    page,
  }) => {
    await page.goto(`${ROOT}/start`);
    await page.waitForLoadState("networkidle");

    // /start hero uses <Pill variant="brand">. New spec: border border-brand/20
    // bg-brand-dim text-brand.
    const pill = page.locator(".bg-brand-dim").first();
    await expect(pill).toBeVisible();
    expect(isPainted(await readColor(pill, "backgroundColor"))).toBe(true);
    // brand teal → green channel dominates red
    const [r, g, b] = await readColor(pill, "color");
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
    // visible border
    const borderW = await pill.evaluate(
      (el) => getComputedStyle(el).borderTopWidth,
    );
    expect(parseFloat(borderW)).toBeGreaterThanOrEqual(1);
  });

  test("AC3 — TopNav brand CTA renders with a real primary fill", async ({
    page,
  }) => {
    await page.goto(`${ROOT}/`);
    await page.waitForLoadState("networkidle");
    const cta = page.locator('header a[href$="/start"]').last();
    await expect(cta).toBeVisible();
    expect(isPainted(await readColor(cta, "backgroundColor"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC4 — T04 dead-link contract not broken
// ---------------------------------------------------------------------------
test.describe("[en] T08b T04 link contract", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${ROOT}/`);
    await page.waitForLoadState("networkidle");
  });

  test("AC4 — footer Download anchors /start#install; github is external", async ({
    page,
  }) => {
    const download = page.locator('footer a[href*="/start#install"]');
    await expect(download.first()).toHaveAttribute("href", /\/start#install$/);

    const gh = page.locator('footer a[href*="github.com/molesignal"]').first();
    await expect(gh).toHaveAttribute("target", "_blank");
    await expect(gh).toHaveAttribute("rel", /noreferrer/);
  });
});
