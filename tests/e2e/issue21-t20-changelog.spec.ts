import { test, expect } from "@playwright/test";

/**
 * ISSUE-21 / T20 — Changelog real-Release data path (DOM layer).
 *
 * The pure-logic data path (getReleases → page entries / RSS feed / anchor
 * parity / prerelease flag / fallback) is gated offline by
 * `scripts/check-changelog.ts` (`pnpm test:changelog`, AC1–AC6).
 *
 * This suite covers the DOM half that the script can't reach. In the standard
 * pipeline there is no GITHUB_TOKEN and the repo has no published Release, so
 * `next start` serves the honest FALLBACK state (static content/changelog.ts).
 * That is exactly the runtime users see today, so we assert it for real:
 *
 *   AC5  the "previewing" (sourceFallback) pill renders — NOT "live from
 *        GitHub" — and the curated versions show with no fabricated data;
 *   AC3  every sidebar version link `#v…` resolves to an `article` with the
 *        matching `id`, and clicking it scrolls that entry into view;
 *   AC2  /changelog/rss.xml is a 2xx feed whose <guid> anchors are exactly the
 *        article ids on the page (same-source, same anchors).
 *
 * The real-DATA DOM assertions (sourceLive pill, pre-release Pill on a live
 * release) require a real token + published Release and are deferred to AC8
 * per the READINESS degrade policy — already proven at the data layer above.
 */

test.describe("changelog fallback state (no token / no release)", () => {
  test("AC5 — renders the 'previewing' pill, not a live-GitHub claim", async ({
    page,
  }) => {
    await page.goto("/changelog");
    await expect(page.getByText("previewing", { exact: true })).toBeVisible();
    await expect(
      page.getByText("live from GitHub", { exact: true }),
    ).toHaveCount(0);
    // At least one curated version entry is rendered (no empty changelog).
    await expect(page.locator("article[id^='v']").first()).toBeVisible();
  });

  test("AC3 — every version nav link resolves to a matching entry id", async ({
    page,
  }) => {
    await page.goto("/changelog");

    const navLinks = page.locator("nav[aria-label='Versions'] a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute("href");
      expect(href, `nav link #${i} has an anchor href`).toMatch(/^#v[\w-]+$/);
      const id = href!.slice(1); // drop the leading '#'
      // The anchor target exists as an article with that exact id (no dead link).
      await expect(page.locator(`article[id="${id}"]`)).toHaveCount(1);
    }
  });

  test("AC3 — clicking a version link scrolls its entry into view", async ({
    page,
  }) => {
    await page.goto("/changelog");

    // Use the last (oldest) version so the jump requires a real scroll.
    const navLinks = page.locator("nav[aria-label='Versions'] a");
    const last = navLinks.nth((await navLinks.count()) - 1);
    const href = await last.getAttribute("href");
    const id = href!.slice(1);

    await last.click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`article[id="${id}"]`)).toBeInViewport();
  });

  test("AC2 — RSS feed is 2xx and its guids match the page entry ids", async ({
    page,
    request,
  }) => {
    // Anchors rendered on the page (article ids), newest-first.
    await page.goto("/changelog");
    const pageIds = await page.locator("article[id^='v']").evaluateAll((els) =>
      els.map((el) => el.id),
    );
    expect(pageIds.length).toBeGreaterThan(0);

    const res = await request.get("/changelog/rss.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");
    const xml = await res.text();

    const guids = [...xml.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map(
      (m) => m[1],
    );
    // Same set of anchors, same order → page and feed are same-source.
    expect(guids).toEqual(pageIds);
  });
});
