import { test, expect, type Page } from "@playwright/test";

/**
 * ISSUE-26 / M1 regression guard — proves the 13 already-shipped M1 features
 * still work end-to-end AFTER the UI token migration + component visual rework
 * (T08/T09/T10/T08b · ISSUE-5/10/11/12). LANE=light: this suite ONLY adds
 * verification; it changes no product code.
 *
 * Coverage map (READINESS M1 "M1 已实现项回归不退化"):
 *   #1  Hero render + mono `$` command preview        → describe "hero"
 *   #2  CrossSignalDemo                               → covered by issue24-t23-*.spec.ts
 *   #7  ArchitectureDiagram interaction               → describe "architecture diagram"
 *   #8  sticky TOC scroll highlight                   → describe "sticky TOC"
 *   #10 CodeBlock copy toast                          → describe "CodeBlock copy"
 *   #16 RSS 200 + application/rss+xml                 → describe "feeds & SEO routes"
 *   #18 OG image 200 image/png                        → describe "feeds & SEO routes"
 *   #19 sitemap.xml / robots.txt / hreflang           → describe "feeds & SEO routes"
 *   #20 theme switch (anti-flicker + persist)         → describe "theme switch"
 *   #21 language switch (preserve scroll)             → covered by issue13-t12-*.spec.ts
 *                                                       (re-asserted lightly here)
 *   #23 PreReleaseBanner (dismiss + 7-day re-show)    → describe "PreReleaseBanner"
 *   #25 a11y landmarks                                → describe "a11y landmarks"
 *                                                       (contrast = `pnpm a11y:contrast`, AC3)
 *   #27 Pricing three tiers                           → describe "pricing tiers"
 *   CostCalculator → issue6-cost-calculator.spec.ts; legal → issue4-legal.spec.ts.
 *
 * AC2 (both themes, no visual breakage) → describe "AC2 · both themes …".
 *
 * Runs against `next start` (production build) per playwright.config.ts.
 */

// Canonical Teal/Amber token hex (05-UI terminal values) → rgb, per theme.
const TOKEN = {
  light: { brand: "rgb(15, 118, 110)", amber: "rgb(180, 83, 9)" }, // #0f766e / #b45309
  dark: { brand: "rgb(45, 212, 191)", amber: "rgb(251, 191, 36)" }, // #2dd4bf / #fbbf24
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// #1 Hero — left-aligned headline, brand highlight, mono `$` command preview
// ---------------------------------------------------------------------------
test.describe("hero", () => {
  test("renders headline, brand highlight and mono $ command preview", async ({
    page,
  }) => {
    await page.goto("/");

    // Pre-release pill + h1 with a teal-highlighted span.
    await expect(page.getByText("pre-1.0 · building in the open")).toBeVisible();
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const highlight = h1.locator("span.text-primary");
    await expect(highlight).toBeVisible();

    // Mono `$` command line — the "this is a real tool" signal. The `$` glyph
    // is its own teal span inside a font-mono paragraph.
    const cmd = page.locator("p.font-mono", { hasText: "$" }).first();
    await expect(cmd).toBeVisible();
    const dollar = cmd.locator("span.text-primary", { hasText: "$" });
    await expect(dollar).toHaveText("$");

    // The real docker command preview (CodeBlock) is present.
    await expect(
      page.getByText("docker compose -f deploy/docker/docker-compose.yaml").first(),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// #7 ArchitectureDiagram — interactive node tooltip switches on click
// ---------------------------------------------------------------------------
test.describe("architecture diagram", () => {
  test("clicking a node updates the live tooltip", async ({ page }) => {
    await page.goto("/architecture");

    // Default active node is the first one (Ingest); its tooltip is a live
    // region (role=status) rendered below the SVG.
    const tooltip = page.getByRole("status").filter({ hasText: "Ingest" });
    await expect(tooltip).toBeVisible();

    // Click a different node in the SVG → tooltip swaps to that node.
    await page.locator('[data-node-id="storage"]').click();
    const storageTip = page.getByRole("status").filter({ hasText: "Parquet" });
    await expect(storageTip).toBeVisible();
    // The previous node label is no longer the active tooltip label.
    await expect(
      page.getByRole("status").filter({ hasText: "Ingest" }),
    ).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// #8 sticky TOC — scroll-driven active-section highlight (IntersectionObserver)
// ---------------------------------------------------------------------------
test.describe("sticky TOC", () => {
  test("active link follows the scrolled-to section", async ({ page }) => {
    await page.goto("/architecture");

    // Desktop rail is visible at the default 1280px viewport (hidden lg:block).
    const queryLink = page.locator('a[href="#query"]:visible');
    await expect(queryLink).toBeVisible();

    // Position the #query section's top at ~80px — just above the IO active
    // band start (rootMargin top "-96px"), so the section *above* it fully
    // exits the band and #query becomes the topmost intersecting section.
    await page.evaluate(() => {
      const el = document.getElementById("query");
      if (!el) return;
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 80);
    });

    // The TOC entry for #query gains the active styling (teal + strong).
    await expect(queryLink).toHaveClass(/text-primary/, { timeout: 5000 });
    // A section we scrolled past is no longer the active one.
    await expect(page.locator('a[href="#data-path"]:visible')).not.toHaveClass(
      /text-primary/,
    );
  });
});

// ---------------------------------------------------------------------------
// #10 CodeBlock — copy flips to "Copied" + sonner toast confirmation
// ---------------------------------------------------------------------------
test.describe("CodeBlock copy", () => {
  test("copy button flips to Copied and fires a toast", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    // Headless clipboard.writeText rejects without document focus; stub so we
    // exercise the UI confirmation, not the browser impl.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      });
    });
    await page.goto("/start");

    const copyBtn = page.locator('button[aria-label="Copy"]:visible').first();
    await expect(copyBtn).toContainText("Copy");
    await copyBtn.click();

    await expect(copyBtn).toContainText("Copied");
    // Sonner toast confirms the action.
    await expect(page.getByText("Copied").last()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// #16 / #18 / #19 feeds & SEO routes — RSS, OG image, sitemap, robots, hreflang
// ---------------------------------------------------------------------------
test.describe("feeds & SEO routes", () => {
  test("RSS feed → 200 application/rss+xml", async ({ request }) => {
    const res = await request.get("/changelog/rss.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    const body = await res.text();
    expect(body).toContain("<rss");
    expect(body).toContain("molesignal changelog");
  });

  test("default OG image → 200 image/png", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  test("sitemap.xml → 200 with EN/ZH hreflang alternates", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain("<urlset");
    // hreflang alternates emitted for static pages.
    expect(xml).toContain('hreflang="en"');
    expect(xml).toContain('hreflang="zh"');
    expect(xml).toContain('hreflang="x-default"');
    // A representative static route + its ZH mirror are present.
    expect(xml).toContain("/why");
    expect(xml).toContain("/zh/why");
  });

  test("robots.txt → 200, disallows /api, points at sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const txt = await res.text();
    expect(txt).toContain("Disallow: /api/");
    expect(txt).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
  });
});

// ---------------------------------------------------------------------------
// #20 theme switch — explicit toggle, persistence, anti-flicker
// ---------------------------------------------------------------------------
test.describe("theme switch", () => {
  test("toggle to dark updates <html data-theme> and persists", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // Open the theme dropdown and pick Dark.
    await page.getByRole("button", { name: "Theme" }).first().click();
    await page.getByRole("menuitem", { name: "Dark" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("molesignal-theme"),
    );
    expect(stored).toBe("dark");
  });

  test("anti-flash: persisted dark theme applies before hydration", async ({
    page,
  }) => {
    // Seed the stored preference before any navigation, mirroring a returning
    // visitor. The inline <head> script must paint dark immediately — no flash.
    await page.addInitScript(() => {
      window.localStorage.setItem("molesignal-theme", "dark");
    });
    await page.goto("/");
    // data-theme is already "dark" with no toggle interaction → the anti-flash
    // script (not React) set it pre-paint.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

// ---------------------------------------------------------------------------
// #23 PreReleaseBanner — dismiss persists, re-shows after the 7-day TTL
// ---------------------------------------------------------------------------
const BANNER_KEY = "molesignal-prerelease-banner-dismissed";

test.describe("PreReleaseBanner", () => {
  const banner = (page: Page) =>
    page.getByRole("region", { name: "Pre-release announcement" });

  test("dismiss hides the banner and persists across reload", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
    // It links to the design-partner funnel and sits at the top of the page.
    await expect(banner(page).getByRole("link")).toHaveAttribute(
      "href",
      /\/design-partner$/,
    );

    await page.getByRole("button", { name: "Dismiss banner" }).click();
    await expect(banner(page)).toHaveCount(0);

    const stored = await page.evaluate(
      (k) => window.localStorage.getItem(k),
      BANNER_KEY,
    );
    expect(Number.parseInt(stored ?? "", 10)).toBeGreaterThan(0);

    // Recent dismissal survives a reload.
    await page.reload();
    await expect(banner(page)).toHaveCount(0);
  });

  test("re-appears once the 7-day dismissal has expired", async ({ page }) => {
    // Expired dismissal (8 days old) → banner shows again.
    await page.addInitScript(
      ({ key, ts }) => window.localStorage.setItem(key, ts),
      { key: BANNER_KEY, ts: String(Date.now() - 8 * DAY_MS) },
    );
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
  });

  test("stays hidden while dismissal is still within 7 days", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, ts }) => window.localStorage.setItem(key, ts),
      { key: BANNER_KEY, ts: String(Date.now() - 1 * DAY_MS) },
    );
    await page.goto("/");
    await expect(banner(page)).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// #25 a11y landmarks — key roles survive the visual rework (contrast → AC3)
// ---------------------------------------------------------------------------
test.describe("a11y landmarks", () => {
  test("home exposes nav, main and the banner region", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#main")).toBeVisible();
    await expect(page.getByRole("navigation").first()).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Pre-release announcement" }),
    ).toBeVisible();
  });

  test("architecture diagram SVG is a labelled image", async ({ page }) => {
    await page.goto("/architecture");
    await expect(
      page.getByRole("img", { name: "molesignal data path" }).first(),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// #27 Pricing — three tier cards render with badge, price and CTA
// ---------------------------------------------------------------------------
test.describe("pricing tiers", () => {
  test("renders exactly three tiers with badge + price + CTA", async ({
    page,
  }) => {
    await page.goto("/pricing");
    const cards = page.locator("#tiers article");
    await expect(cards).toHaveCount(3);

    for (const badge of ["Open Source", "Enterprise", "Cloud (SaaS)"]) {
      await expect(page.locator("#tiers").getByText(badge).first()).toBeVisible();
    }
    // Each card carries a CTA (link or anchor).
    for (let i = 0; i < 3; i++) {
      await expect(cards.nth(i).locator("a").last()).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// #21 language switch (preserve scroll) — primary guard lives in
// issue13-t12-critical-paths.spec.ts; re-asserted here so this M1 bundle is
// self-describing.
// ---------------------------------------------------------------------------
test("language switch (EN→ZH) keeps the reading position", async ({ page }) => {
  await page.goto("/why");
  await page.evaluate(() => window.scrollTo(0, 1200));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(600);

  await page.getByRole("button", { name: "Language" }).first().click();
  await page.getByRole("menuitem", { name: "中文" }).click();
  await page.waitForURL("**/zh/why");
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(600);
});

// ---------------------------------------------------------------------------
// AC2 · both themes show the Teal/Amber tokens (no collapsed/wrong-palette
// visual breakage). Samples computed colour of real legacy-class consumers.
// ---------------------------------------------------------------------------
for (const theme of ["light", "dark"] as const) {
  test.describe(`AC2 · ${theme} theme palette`, () => {
    test.use({ colorScheme: theme });

    test("brand (teal) + accent (amber) tokens compute correctly", async ({
      page,
    }) => {
      await page.addInitScript((t) => {
        window.localStorage.setItem("molesignal-theme", t);
      }, theme);

      // Brand: the hero `$` glyph consumes text-primary → teal.
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const dollar = page
        .locator("p.font-mono span.text-primary", { hasText: "$" })
        .first();
      await expect(dollar).toBeVisible();
      const brand = await dollar.evaluate(
        (el) => getComputedStyle(el).color,
      );
      expect(brand).toBe(TOKEN[theme].brand);

      // Accent: the architecture perf banner label consumes
      // text-marketing-accent → amber.
      await page.goto("/architecture");
      const accentEl = page.locator("span.text-marketing-accent").first();
      await expect(accentEl).toBeVisible();
      const amber = await accentEl.evaluate(
        (el) => getComputedStyle(el).color,
      );
      expect(amber).toBe(TOKEN[theme].amber);

      // Sanity: the page background actually resolved a token (not transparent).
      const bg = await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      );
      expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    });
  });
}
