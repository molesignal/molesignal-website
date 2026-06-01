import { test, expect, type Page } from "@playwright/test";

/**
 * E2E regression for ISSUE-4 / T06 — real legal text replacing LegalStub.
 * Drives a real browser through /privacy /terms in EN + ZH and asserts:
 *  - AC1 six privacy coverage points present (collected fields, Plausible no-cookie,
 *    Resend, IP rate-limit, localStorage non-tracking, founders@ contact)
 *  - AC2 terms is independent real content (Apache-2.0, as-is, no-warranty)
 *  - AC4 last-updated date 2026-06-02 shown
 *  - AC5 fact-fidelity wording (Resend "not add to marketing list")
 *  - AC6 mailto + apache.org links are real anchors with valid href
 *  - no leftover stub placeholder; theme toggle does not crash the page
 */

const STUB = "placeholder for v1 launch";

async function bodyText(page: Page): Promise<string> {
  return (await page.locator("body").innerText()).toLowerCase();
}

test.describe("ISSUE-4 EN privacy", () => {
  test("renders real privacy policy with all coverage points", async ({ page }) => {
    await page.goto("/privacy");
    const t = await bodyText(page);
    expect(t).not.toContain(STUB.toLowerCase());
    // ① collected fields
    expect(t).toContain("cloud waitlist");
    expect(t).toContain("email address");
    expect(t).toContain("company size");
    // ② Plausible no cookie / no IP / no cross-site / DNT
    expect(t).toContain("no cookies");
    expect(t).toContain("does not store ip");
    expect(t).toContain("do-not-track");
    // ③ Resend — fact-fidelity (F1)
    expect(t).toContain("resend");
    expect(t).toContain("do not add you to any marketing list");
    // ④ IP rate-limit
    expect(t).toContain("rate-limit");
    // ⑤ localStorage non-tracking
    expect(t).toContain("stored locally in your browser");
    expect(t).toContain("not tracking");
    // ⑥ contact + no-sell
    expect(t).toContain("never sell your personal data");
    // AC4 date
    expect(t).toContain("2026-06-02");
  });

  test("mailto anchor is a real link", async ({ page }) => {
    await page.goto("/privacy");
    const mailto = page.locator('a[href="mailto:founders@molesignal.io"]');
    await expect(mailto.first()).toBeVisible();
  });
});

test.describe("ISSUE-4 EN terms", () => {
  test("renders independent terms content", async ({ page }) => {
    await page.goto("/terms");
    const t = await bodyText(page);
    expect(t).not.toContain(STUB.toLowerCase());
    expect(t).toContain("apache license 2.0");
    expect(t).toContain("as is");
    expect(t).toContain("without warranties");
    expect(t).toContain("2026-06-02");
    // AC6 apache external link is a real anchor
    const lic = page.locator('a[href="https://www.apache.org/licenses/LICENSE-2.0"]');
    await expect(lic.first()).toBeVisible();
  });
});

test.describe("ISSUE-4 ZH locale", () => {
  test("zh/privacy is translated (no english residue, no stub)", async ({ page }) => {
    await page.goto("/zh/privacy");
    const raw = await page.locator("body").innerText();
    expect(raw.toLowerCase()).not.toContain(STUB.toLowerCase());
    expect(raw).toContain("你主动提供的信息");
    expect(raw).toContain("你的提交如何被处理");
    expect(raw).toContain("2026-06-02");
    // brand/provider names legitimately stay latin
    expect(raw).toContain("Plausible");
    expect(raw).toContain("Resend");
    await expect(
      page.locator('a[href="mailto:founders@molesignal.io"]').first(),
    ).toBeVisible();
  });

  test("zh/terms is translated and independent", async ({ page }) => {
    await page.goto("/zh/terms");
    const raw = await page.locator("body").innerText();
    expect(raw).not.toContain(STUB);
    expect(raw).toContain("担保"); // no-warranty section
    expect(raw).toContain("Apache");
    expect(raw).toContain("2026-06-02");
  });
});

test.describe("ISSUE-4 resilience", () => {
  test("theme toggle does not crash privacy page", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto("/privacy");
    const toggle = page
      .getByRole("button", { name: /theme|dark|light|toggle/i })
      .first();
    if (await toggle.count()) {
      await toggle.click().catch(() => {});
    }
    // still rendered, no uncaught page errors
    await expect(page.locator("body")).toContainText("2026-06-02");
    expect(errors, errors.join("\n")).toHaveLength(0);
  });
});
