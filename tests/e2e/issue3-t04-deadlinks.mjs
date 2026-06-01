/**
 * ISSUE-3 / T04 dead-link & vaporware governance — interactive E2E.
 * Standalone Playwright script (run against `pnpm dev` on :3000) verifying the
 * user-facing acceptance criteria that static HTML grep can't fully prove:
 *   AC2  Discord/Twitter render as non-clickable disabled state (no anchor)
 *   AC3  Download (nav dropdown + footer) → /start and scrolls to #install
 *   AC4  helm & binary tabs surface the v1.0 "not yet shipped" notice on click
 *   AC1  no "Docs" item / no docs.molesignal.io anchors anywhere reachable
 * Exit code 0 = all asserts pass.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.SITE ?? "http://localhost:3000";
const results = [];
let failed = 0;

function check(name, cond, detail = "") {
  results.push({ name, ok: !!cond, detail });
  if (!cond) failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  // ---------- AC1 + AC2 on HOME ----------
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  // No docs.molesignal.io anchor anywhere in the live DOM
  const docsAnchors = await page.locator('a[href*="docs.molesignal.io"]').count();
  check("AC1 no docs.molesignal.io anchor on home", docsAnchors === 0, `count=${docsAnchors}`);

  // No active href="#" placeholder anchors
  const hashAnchors = await page.locator('a[href="#"]').count();
  check("AC2/honesty no href=\"#\" placeholder anchor on home", hashAnchors === 0, `count=${hashAnchors}`);

  // Footer Discord/Twitter must NOT be anchors; must be aria-disabled
  const discordAnchor = await page.locator('footer a:has-text("Discord")').count();
  const discordDisabled = await page.locator('footer [aria-disabled="true"]:has-text("Discord")').count();
  check("AC2 footer Discord is NOT an anchor", discordAnchor === 0, `anchorCount=${discordAnchor}`);
  check("AC2 footer Discord is aria-disabled", discordDisabled > 0, `disabledCount=${discordDisabled}`);

  const twitterAnchor = await page.locator('footer a:has-text("Twitter")').count();
  check("AC2 footer Twitter is NOT an anchor", twitterAnchor === 0, `anchorCount=${twitterAnchor}`);

  // Community-callout Discord card disabled (home renders it)
  const calloutDisabled = await page.locator('[aria-disabled="true"][title*="Launching soon"]').count();
  check("AC2 community-callout Discord card disabled", calloutDisabled > 0, `count=${calloutDisabled}`);

  // ---------- AC1: Resources dropdown has no "Docs" ----------
  // Open the desktop Resources dropdown
  await page.getByRole("button", { name: /resources/i }).first().click();
  await page.waitForTimeout(300);
  const menuText = await page.locator('[role="menu"]').first().innerText().catch(() => "");
  check("AC1 Resources menu shows Download", /download/i.test(menuText), JSON.stringify(menuText.replace(/\s+/g, " ").slice(0, 120)));
  check("AC1 Resources menu has NO 'Docs' item", !/\bdocs\b/i.test(menuText), "menu text checked");

  // ---------- AC3: Download → /start#install + scroll ----------
  await page.getByRole("menuitem", { name: /download/i }).first().click();
  // Client-side (next-intl Link) nav — wait for the /start route to settle.
  await page.waitForURL(/\/start(#install)?$/, { timeout: 5000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  const url = page.url();
  check("AC3 Download navigates to /start (anchor #install)", /\/start(#install)?$/.test(url), url);

  // #install element exists and is scrolled into the viewport
  const installBox = await page.locator('#install').boundingBox();
  const inView = installBox ? installBox.y < 900 && installBox.y > -installBox.height : false;
  check("AC3 #install section exists & is in viewport after anchor jump", !!installBox && inView,
    installBox ? `y=${Math.round(installBox.y)}` : "no #install element");

  // ---------- AC4: helm & binary tabs show v1.0 notice ----------
  // Read expected notice strings from messages
  const v1en = (await import("node:fs")).readFileSync("messages/en.json", "utf8");
  const v1Notice = JSON.parse(v1en).start.v1Notice;
  const noticeHead = v1Notice.slice(0, 28);

  // Click Helm tab
  await page.getByRole("tab", { name: /helm/i }).click();
  await page.waitForTimeout(200);
  const helmNoticeVisible = await page.getByRole("note").filter({ hasText: noticeHead }).isVisible().catch(() => false);
  check("AC4 helm tab shows v1.0 notice", helmNoticeVisible, noticeHead);

  // Click Binary tab
  await page.getByRole("tab", { name: /binary/i }).click();
  await page.waitForTimeout(200);
  const binaryNoticeVisible = await page.getByRole("note").filter({ hasText: noticeHead }).isVisible().catch(() => false);
  check("AC4 binary tab shows v1.0 notice", binaryNoticeVisible, noticeHead);

  // Docker tab should NOT show the notice (honest: docker works today)
  await page.getByRole("tab", { name: /docker/i }).click();
  await page.waitForTimeout(200);
  const dockerNoticeVisible = await page.getByRole("note").filter({ hasText: noticeHead }).isVisible().catch(() => false);
  check("AC4 docker tab has NO v1.0 notice (works today)", !dockerNoticeVisible, `visible=${dockerNoticeVisible}`);

  // Screenshot evidence
  await page.goto(`${BASE}/start`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /binary/i }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/issue3-t04-binary-notice.png", fullPage: false });

} finally {
  await browser.close();
}

console.log(`\n  ${results.length - failed}/${results.length} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
