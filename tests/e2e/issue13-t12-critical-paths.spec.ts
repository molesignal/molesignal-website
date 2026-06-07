import { test, expect, type Page } from "@playwright/test";

/**
 * ISSUE-13 / T12 — critical-path E2E (Playwright).
 *
 * Where analytics-funnel.spec.ts proves the `track()` wiring, this suite proves
 * the *user-visible* happy/sad paths a visitor actually experiences:
 *
 *   1. Both conversion forms: mock API 2xx → persistent green success card.
 *   2. Both forms under rate limit: mock API 429 → gentle amber notice, form
 *      survives (nothing the user typed is lost).
 *   3. Locale switch (EN→ZH) preserves the scroll position (PRD D6 / #21).
 *   4. CodeBlock copy flips to the "Copied" confirmation state.
 *   5. Key internal routes all respond 2xx (no dead links on the happy path),
 *      EN + ZH.
 *
 * Runs against `next start` (production build) per playwright.config.ts so the
 * verified behaviour matches what ships. All network to the two form APIs is
 * mocked, so no external keys (Resend / Upstash) are needed.
 */

// ---------------------------------------------------------------------------
// 1 + 2. Cloud waitlist form — 2xx success card / 429 amber notice
// ---------------------------------------------------------------------------
test.describe("cloud waitlist form", () => {
  test("2xx → persistent green success card", async ({ page }) => {
    await page.route("**/api/cloud-waitlist", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/cloud");
    await page.locator("#cw-email").fill("real.user@example.com");
    await page.locator('form button[type="submit"]').first().click();

    // Success card carries role=status and the localized "You're on the list."
    const card = page.getByRole("status").filter({ hasText: "You're on the list." });
    await expect(card).toBeVisible();
    // The form input is gone — the card replaces the form (persistent state).
    await expect(page.locator("#cw-email")).toHaveCount(0);
  });

  test("429 → amber rate-limit notice, form stays", async ({ page }) => {
    await page.route("**/api/cloud-waitlist", (r) =>
      r.fulfill({ status: 429, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/cloud");
    await page.locator("#cw-email").fill("real.user@example.com");
    await page.locator('form button[type="submit"]').first().click();

    const notice = page.getByText(/sending these a bit fast/i);
    await expect(notice).toBeVisible();
    // It's the warm amber notice, not a destructive red error.
    await expect(notice).toHaveClass(/border-amber/);
    // Form survives so the visitor can simply retry; their email is untouched.
    await expect(page.locator("#cw-email")).toHaveValue("real.user@example.com");
  });
});

// ---------------------------------------------------------------------------
// 1 + 2. Design-partner form — 2xx success card / 429 amber notice
// ---------------------------------------------------------------------------
async function fillDesignPartner(page: Page) {
  await page.locator("#dp-name").fill("Ada Lovelace");
  await page.locator("#dp-email").fill("ada@example.com");
  await page.selectOption("#dp-size", "11-50");
  await page.selectOption("#dp-stack", "Datadog");
  await page.locator("#dp-pain").fill("Too many disconnected dashboards.");
}

test.describe("design-partner form", () => {
  test("2xx → success card replaces the form", async ({ page }) => {
    await page.route("**/api/design-partner", (r) =>
      r.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/design-partner");
    await fillDesignPartner(page);
    await page.locator('form button[type="submit"]').first().click();

    const card = page
      .getByRole("status")
      .filter({ hasText: "We'll reply within 48 hours." });
    await expect(card).toBeVisible();
    await expect(page.locator("#dp-name")).toHaveCount(0);
  });

  test("429 → amber notice, filled fields preserved", async ({ page }) => {
    await page.route("**/api/design-partner", (r) =>
      r.fulfill({ status: 429, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/design-partner");
    await fillDesignPartner(page);
    await page.locator('form button[type="submit"]').first().click();

    const notice = page.getByText(/Too many submissions from your network/i);
    await expect(notice).toBeVisible();
    await expect(notice).toHaveClass(/border-amber/);
    // Nothing the user typed is lost (form is not unmounted).
    await expect(page.locator("#dp-name")).toHaveValue("Ada Lovelace");
    await expect(page.locator("#dp-pain")).toHaveValue(
      "Too many disconnected dashboards.",
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Locale switch preserves scroll position
// ---------------------------------------------------------------------------
test("locale switch (EN→ZH) preserves scroll position", async ({ page }) => {
  await page.goto("/why");
  // /why is a long page (cost calculator + compare table). Scroll well down.
  await page.evaluate(() => window.scrollTo(0, 1200));
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(600);

  await page.getByRole("button", { name: "Language" }).first().click();
  await page.getByRole("menuitem", { name: "中文" }).click();
  await page.waitForURL("**/zh/why");

  // Give the soft navigation a beat to settle, then assert we did NOT jump to
  // the top — the visitor stays roughly where they were reading.
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => window.scrollY);
  expect(after).toBeGreaterThan(600);
});

// ---------------------------------------------------------------------------
// 4. CodeBlock copy → "Copied" confirmation state
// ---------------------------------------------------------------------------
test("CodeBlock copy flips to the Copied confirmation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Headless clipboard.writeText rejects without document focus; stub it to
  // resolve so we exercise the UI confirmation, not the browser impl.
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
  // Button text + icon flip to the confirmation ("Copied") for ~1.4s.
  await expect(copyBtn).toContainText("Copied");
});

// ---------------------------------------------------------------------------
// 5. Key internal routes respond 2xx (no dead links on the happy path)
// ---------------------------------------------------------------------------
const ROUTES = [
  "/",
  "/why",
  "/cloud",
  "/design-partner",
  "/start",
  "/pricing",
  "/architecture",
  "/roadmap",
  "/blog",
  "/privacy",
  "/terms",
];

test("key internal routes respond 2xx (EN + ZH)", async ({ request }) => {
  for (const path of ROUTES) {
    const en = await request.get(path);
    expect(en.status(), `EN ${path}`).toBeLessThan(400);
    // ZH mirror (blog is intentionally EN-only → /zh/blog redirects, still 2xx).
    const zhPath = path === "/" ? "/zh" : `/zh${path}`;
    const zh = await request.get(zhPath);
    expect(zh.status(), `ZH ${zhPath}`).toBeLessThan(400);
  }
});
