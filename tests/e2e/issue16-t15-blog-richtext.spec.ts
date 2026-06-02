import { test, expect } from "@playwright/test";

/**
 * ISSUE-16 / T15 — Blog rich-text rendering (Playwright).
 *
 * Proves the blog detail page renders its MDX body as rich text instead of
 * flat paragraphs:
 *
 *   1. Markdown headings become real <h2> elements.
 *   2. Markdown lists become real <ul><li> elements (not literal "- " text).
 *   3. Fenced code blocks render through the Shiki-powered CodeBlock — dual
 *      vitesse themes + a working copy button (Shiki reuse, AC②).
 *   4. Inline code renders as a styled <code> chip.
 *   5. Related-posts-by-tag still works (AC③): the related section is present.
 *
 * Runs against `next start` (production SSG) per playwright.config.ts, so it
 * verifies what actually ships. No external keys needed.
 */

const POST = "/blog/why-parquet-for-three-signals";

test.describe("ISSUE-16 / T15 blog rich-text", () => {
  test("renders headings, lists, inline code from Markdown", async ({
    page,
  }) => {
    await page.goto(POST);

    const article = page.locator("article");

    // 1. Section headings exist as real <h2> inside the article body.
    await expect(
      article.getByRole("heading", {
        level: 2,
        name: "Three stores is the industry default",
      }),
    ).toBeVisible();
    await expect(
      article.getByRole("heading", {
        level: 2,
        name: "One columnar store, one query language",
      }),
    ).toBeVisible();

    // 2. The Markdown list is a real <ul><li>, not literal dashes.
    const list = article.locator("ul").first();
    await expect(list).toBeVisible();
    expect(await list.locator("li").count()).toBeGreaterThanOrEqual(3);

    // 3. Inline code rendered as <code> (no leftover backticks in text).
    await expect(
      article.locator("code", {
        hasText: "trace_id → log line → host metric",
      }),
    ).toBeVisible();
    await expect(article).not.toContainText("`trace_id");
  });

  test("renders a Shiki-highlighted code block with working copy", async ({
    page,
  }) => {
    await page.goto(POST);

    // Shiki dual-theme output: a <pre class="shiki ..."> inside a CodeBlock
    // chrome tagged with the language.
    const codeBlock = page.locator('[data-language="sql"]');
    await expect(codeBlock).toBeVisible();
    await expect(codeBlock.locator("pre.shiki").first()).toBeVisible();
    // Shiki tokenized the SQL (token spans carry inline color styles).
    await expect(codeBlock.getByText("SELECT", { exact: false })).toBeVisible();

    // The copy button from the CodeBlock chrome works and confirms.
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"]);
    const copyBtn = codeBlock.getByRole("button", { name: "Copy" });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    const copied = await page.evaluate(() =>
      navigator.clipboard.readText(),
    );
    expect(copied).toContain("SELECT");
  });

  test("related-posts-by-tag section still works (AC3)", async ({ page }) => {
    await page.goto(POST);
    // The related section renders the sibling post (provider getRelatedPosts).
    await expect(
      page.getByRole("heading", { name: "Related posts" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: /What we learned reading 100 incident reviews/,
      }),
    ).toBeVisible();
  });
});
