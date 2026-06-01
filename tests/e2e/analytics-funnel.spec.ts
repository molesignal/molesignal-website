import { test, expect, type Page } from "@playwright/test";

/**
 * ISSUE-2 / T05 — conversion-funnel analytics wiring (11 events).
 *
 * Strategy: before each navigation we stub `window.plausible` with a recorder
 * that pushes every call into sessionStorage (survives same-tab client nav).
 * `track()` (lib/analytics.ts) calls `window.plausible(event, { props })`, so
 * the recorder captures exactly what the funnel would receive. We then assert
 * event name + props + (for forms) the API-2xx timing contract.
 */

const KEY = "__pl_events";

type Ev = { event: string; props: Record<string, unknown> | null };

const recorder = `
  window.plausible = function (event, opts) {
    try {
      var arr = JSON.parse(sessionStorage.getItem("${KEY}") || "[]");
      arr.push({ event: event, props: opts && opts.props ? opts.props : null });
      sessionStorage.setItem("${KEY}", JSON.stringify(arr));
    } catch (e) {}
  };
`;

test.beforeEach(async ({ page }) => {
  // Runs before every document load (incl. client navigations) — re-installs
  // the recorder without clearing the accumulated sessionStorage list.
  await page.addInitScript(recorder);
});

async function events(page: Page): Promise<Ev[]> {
  return page.evaluate(
    (k) => JSON.parse(sessionStorage.getItem(k) || "[]"),
    KEY,
  );
}
async function clearEvents(page: Page) {
  await page.evaluate((k) => sessionStorage.removeItem(k), KEY);
}
const only = (evs: Ev[], name: string) => evs.filter((e) => e.event === name);

// ---------------------------------------------------------------------------
// 1. cta_click — delegated listener on a server-rendered hero CTA (Link)
// ---------------------------------------------------------------------------
test("cta_click fires with {label, source_page, destination} on hero CTA", async ({
  page,
}) => {
  await page.goto("/");
  await clearEvents(page);
  await page
    .locator('main a[data-analytics-event="cta_click"]')
    .first()
    .click();
  await page.waitForURL("**/start");
  const cta = only(await events(page), "cta_click");
  expect(cta.length).toBeGreaterThanOrEqual(1);
  expect(cta[0].props).toMatchObject({
    label: "Try it",
    source_page: "/",
    destination: "/start",
  });
});

// ---------------------------------------------------------------------------
// 2. demo_tab_switch — AC4 dedup (re-click same tab = no event) + enum props
// ---------------------------------------------------------------------------
test("demo_tab_switch fires only on real tab change, tab ∈ {trace,logs,metric}", async ({
  page,
}) => {
  await page.goto("/");
  await clearEvents(page);
  const tablist = page.locator('[role="tablist"]').first();
  const logs = tablist.getByRole("tab", { name: "Logs" });
  const metric = tablist.getByRole("tab", { name: "Metric" });

  await logs.click(); // trace -> logs : fires once
  await logs.click(); // logs -> logs  : NO event (dedup)
  let evs = only(await events(page), "demo_tab_switch");
  expect(evs.length).toBe(1);
  expect(evs[0].props).toEqual({ tab: "logs" });

  await metric.click(); // logs -> metric : fires
  evs = only(await events(page), "demo_tab_switch");
  expect(evs.length).toBe(2);
  expect(evs[1].props).toEqual({ tab: "metric" });
});

// ---------------------------------------------------------------------------
// 3. cost_calculator_interact — AC4: once per mount; numeric props
// ---------------------------------------------------------------------------
test("cost_calculator_interact fires once per mount with numeric props", async ({
  page,
}) => {
  await page.goto("/why");
  await clearEvents(page);
  const slider = page.locator('input[type="range"]').first();
  await slider.focus();
  await slider.press("ArrowRight"); // first interaction
  await slider.press("ArrowRight"); // guarded — no second event
  const evs = only(await events(page), "cost_calculator_interact");
  expect(evs.length).toBe(1);
  expect(typeof evs[0].props?.ingest_gb).toBe("number");
  expect(typeof evs[0].props?.retention_days).toBe("number");
});

// ---------------------------------------------------------------------------
// 4. waitlist_submit — AC3 timing: 2xx fires, 429 does NOT, honeypot does NOT
// ---------------------------------------------------------------------------
test("waitlist_submit fires only after a 2xx API response", async ({ page }) => {
  await page.route("**/api/cloud-waitlist", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/cloud");
  await clearEvents(page);
  await page.locator("#cw-email").fill("real.user@example.com");
  await page.locator('form button[type="submit"]').first().click();
  await expect(page.getByRole("status")).toBeVisible();
  const evs = only(await events(page), "waitlist_submit");
  expect(evs.length).toBe(1);
  expect(evs[0].props).toBeNull(); // AC5: no PII / no props
});

test("waitlist_submit does NOT fire on 429 (rate limited)", async ({ page }) => {
  await page.route("**/api/cloud-waitlist", (r) =>
    r.fulfill({ status: 429, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/cloud");
  await clearEvents(page);
  await page.locator("#cw-email").fill("real.user@example.com");
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(800);
  expect(only(await events(page), "waitlist_submit").length).toBe(0);
});

test("waitlist_submit does NOT fire on honeypot (no API call)", async ({
  page,
}) => {
  let apiCalled = false;
  await page.route("**/api/cloud-waitlist", (r) => {
    apiCalled = true;
    return r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto("/cloud");
  await clearEvents(page);
  await page.locator("#cw-email").fill("real.user@example.com");
  // Trip the honeypot via the RHF-registered hidden field.
  await page.locator('input[name="website"]').first().evaluate((el) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(input, "http://bot.example");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(800);
  // Honeypot value (length>0) is rejected by zod `website: max(0)` at the RHF
  // resolver, so onSubmit never runs: no API call and — the AC3 point — no
  // track(). Either way bot traffic cannot reach the funnel.
  expect(apiCalled).toBe(false);
  expect(only(await events(page), "waitlist_submit").length).toBe(0);
});

// ---------------------------------------------------------------------------
// 5. design_partner_submit — AC3 timing: 2xx fires, 5xx does NOT
// ---------------------------------------------------------------------------
async function fillDesignPartner(page: Page) {
  await page.locator("#dp-name").fill("Ada Lovelace");
  await page.locator("#dp-email").fill("ada@example.com");
  await page.selectOption("#dp-size", "11-50");
  await page.selectOption("#dp-stack", "Datadog");
  await page.locator("#dp-pain").fill("Too many disconnected dashboards.");
}

test("design_partner_submit fires after 2xx (no PII props)", async ({ page }) => {
  await page.route("**/api/design-partner", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/design-partner");
  await clearEvents(page);
  await fillDesignPartner(page);
  await page.locator('form button[type="submit"]').first().click();
  await expect(page.getByRole("status")).toBeVisible();
  const evs = only(await events(page), "design_partner_submit");
  expect(evs.length).toBe(1);
  expect(evs[0].props).toBeNull();
});

test("design_partner_submit does NOT fire on 500", async ({ page }) => {
  await page.route("**/api/design-partner", (r) =>
    r.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
  );
  await page.goto("/design-partner");
  await clearEvents(page);
  await fillDesignPartner(page);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(800);
  expect(only(await events(page), "design_partner_submit").length).toBe(0);
});

// ---------------------------------------------------------------------------
// 6. theme_switch — {theme} (no dedup, always fires on choose)
// ---------------------------------------------------------------------------
test("theme_switch fires with {theme:'dark'}", async ({ page }) => {
  await page.goto("/");
  await clearEvents(page);
  await page.getByRole("button", { name: "Theme" }).first().click();
  await page.getByRole("menuitem", { name: "Dark" }).click();
  const evs = only(await events(page), "theme_switch");
  expect(evs.length).toBe(1);
  expect(evs[0].props).toEqual({ theme: "dark" });
});

// ---------------------------------------------------------------------------
// 7. locale_switch — {from,to,page}
// ---------------------------------------------------------------------------
test("locale_switch fires with {from:'en',to:'zh',page:'/'}", async ({ page }) => {
  await page.goto("/");
  await clearEvents(page);
  await page.getByRole("button", { name: "Language" }).first().click();
  await page.getByRole("menuitem", { name: "中文" }).click();
  await page.waitForURL("**/zh");
  const evs = only(await events(page), "locale_switch");
  expect(evs.length).toBe(1);
  expect(evs[0].props).toEqual({ from: "en", to: "zh", page: "/" });
});

// ---------------------------------------------------------------------------
// 8. quickstart_copy — {tab,snippet_type} after clipboard write
// ---------------------------------------------------------------------------
test("quickstart_copy fires with {tab:'docker',snippet_type:'install'}", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Headless clipboard.writeText rejects without document focus; stub it to
  // resolve so we test the analytics wiring (track fires after a *successful*
  // copy), not the browser clipboard implementation.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await page.goto("/start");
  await clearEvents(page);
  await page.locator('button[aria-label="Copy"]:visible').first().click();
  const evs = only(await events(page), "quickstart_copy");
  expect(evs.length).toBe(1);
  expect(evs[0].props).toEqual({ tab: "docker", snippet_type: "install" });
});

// ---------------------------------------------------------------------------
// 9. compare_table_expand — {source_page}
// ---------------------------------------------------------------------------
test("compare_table_expand fires with {source_page:'/'}", async ({ page }) => {
  await page.goto("/");
  await clearEvents(page);
  await page
    .locator('a[data-analytics-event="compare_table_expand"]')
    .first()
    .click();
  await page.waitForURL("**/why**");
  const evs = only(await events(page), "compare_table_expand");
  expect(evs.length).toBeGreaterThanOrEqual(1);
  expect(evs[0].props).toEqual({ source_page: "/" });
});

// ---------------------------------------------------------------------------
// 10. github_star_click — {source_page}  (target=_blank, no current-page nav)
// ---------------------------------------------------------------------------
test("github_star_click fires with {source_page}", async ({ page }) => {
  await page.goto("/design-partner");
  await clearEvents(page);
  await page
    .locator('a[data-analytics-event="github_star_click"]')
    .first()
    .click({ modifiers: ["Alt"] }); // Alt suppresses opening a new tab
  const evs = only(await events(page), "github_star_click");
  expect(evs.length).toBeGreaterThanOrEqual(1);
  expect(evs[0].props).toMatchObject({ source_page: "/design-partner" });
});

// ---------------------------------------------------------------------------
// 11. rss_subscribe — no props (abort the rss.xml navigation; capture fired first)
// ---------------------------------------------------------------------------
test("rss_subscribe fires (no props)", async ({ page }) => {
  await page.goto("/changelog");
  await clearEvents(page);
  const rss = page.locator('[data-analytics-event="rss_subscribe"]').first();
  // Cancel only the default navigation (capture-phase analytics listener still
  // runs first), so we can read sessionStorage on the same document.
  await rss.evaluate((el) =>
    el.addEventListener("click", (e) => e.preventDefault()),
  );
  await rss.click();
  await page.waitForTimeout(300);
  const evs = only(await events(page), "rss_subscribe");
  expect(evs.length).toBeGreaterThanOrEqual(1);
  expect(evs[0].props).toBeNull();
});
