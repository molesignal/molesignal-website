import { test, expect, request as playwrightRequest } from "@playwright/test";

/**
 * ISSUE-22 / T21 — Blog ZH EN-only notice (Playwright).
 *
 * Blog stays English-only in v1 (PRD §1). These tests guard the ZH "friendly
 * unavailable" prompt and, crucially, the AC2 dead-link guard on the detail
 * page:
 *
 *   1. `/zh/blog` renders the notice + a descriptive "read the English Blog"
 *      link that points to `/blog` and resolves 2xx (AC1).
 *   2. `/zh/blog/<existing-slug>` deep-links to that post's EN version (200)
 *      (AC2 — existing slug branch).
 *   3. `/zh/blog/<missing-slug>` falls back to the `/blog` index instead of
 *      linking to `/blog/<missing-slug>` (404). This is the AC2 core
 *      regression point — an unknown ZH slug must never produce a dead link.
 *
 * Runs against `next start` (production) per playwright.config.ts.
 */

const EXISTING_SLUG = "why-parquet-for-three-signals";
const MISSING_SLUG = "does-not-exist-xyz";

test.describe("ISSUE-22 / T21 blog ZH EN-only notice", () => {
  test("/zh/blog renders notice with a working English link (AC1)", async ({
    page,
  }) => {
    await page.goto("/zh/blog");

    // Friendly notice heading (no clickable-looking arrow in the title).
    await expect(
      page.getByRole("heading", { name: "Blog 目前仅支持英文版" }),
    ).toBeVisible();

    // Descriptive link (not a raw URL path) → EN blog index. next-intl emits
    // an explicit `/en` prefix on cross-locale links under `as-needed`.
    const link = page.getByRole("link", { name: "阅读英文版 Blog →" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/blog$/);
    const href = await link.getAttribute("href");

    // Following it lands on the EN blog list, HTTP 2xx, non-dead.
    const res = await page.request.get(href!);
    expect(res.status()).toBeLessThan(400);
  });

  test("/zh/blog/<existing> deep-links to the EN post 200 (AC2)", async ({
    page,
  }) => {
    await page.goto(`/zh/blog/${EXISTING_SLUG}`);

    await expect(
      page.getByRole("heading", { name: "Blog 目前仅支持英文版" }),
    ).toBeVisible();

    const link = page.getByRole("link", { name: "阅读该文章英文版 →" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      new RegExp(`/blog/${EXISTING_SLUG}$`),
    );
    const href = await link.getAttribute("href");

    const res = await page.request.get(href!);
    expect(res.status()).toBeLessThan(400);
  });

  test("/zh/blog/<missing> falls back to /blog, no dead link (AC2 core)", async ({
    page,
  }) => {
    await page.goto(`/zh/blog/${MISSING_SLUG}`);

    await expect(
      page.getByRole("heading", { name: "Blog 目前仅支持英文版" }),
    ).toBeVisible();

    // The fallback link uses the generic "read the English Blog" label and
    // points at the index — NOT at /blog/<missing-slug>.
    const link = page.getByRole("link", { name: "阅读英文版 Blog →" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/blog$/);
    const href = await link.getAttribute("href");
    expect(href).not.toContain(MISSING_SLUG);

    // The fallback target resolves 2xx (no dead link)…
    const ok = await page.request.get(href!);
    expect(ok.status()).toBeLessThan(400);

    // …while the EN post the OLD code would have linked to is a real 404,
    // proving the guard matters. Use a cookie-clean context so the shared
    // NEXT_LOCALE=zh cookie can't redirect the EN path to the ZH notice.
    const clean = await playwrightRequest.newContext({
      baseURL: page.url().replace(/\/zh\/blog\/.*$/, ""),
    });
    const dead = await clean.get(`/blog/${MISSING_SLUG}`);
    expect(dead.status()).toBe(404);
    await clean.dispose();
  });
});
