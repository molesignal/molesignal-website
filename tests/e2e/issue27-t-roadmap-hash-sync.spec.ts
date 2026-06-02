import { test, expect, type Page } from "@playwright/test";

/**
 * ISSUE-27 / M3 regression guard — Roadmap tab ↔ URL hash two-way sync.
 *
 * READINESS.md M3 "已实现项回归：roadmap tab 与 URL hash 同步" (PRD §7). The
 * sync already lives in `components/roadmap-list.tsx`; this suite writes
 * objective assertions so the post-UI-revamp behaviour can't silently rot.
 *
 * Implementation facts this suite locks (verified against the component):
 *   - Roadmap renders at `/[locale]/roadmap`; hashes are the phase keys
 *     themselves — `#now` / `#next` / `#later` / `#done` (NOT `#phase-*`).
 *     The default `en` locale has no URL prefix, so its route is `/roadmap`
 *     (a `/en/...` request redirects there, hash preserved); `zh` keeps `/zh`.
 *   - Clicking a tab calls `history.replaceState("#<phase>")` → the URL hash
 *     updates and content switches, *without* polluting the back stack (by
 *     design — tab clicks are not history entries).
 *   - A `hashchange` listener drives deep-links (mount-time read) and browser
 *     back/forward navigation between phases.
 *   - The per-item `<Pill>` renders the lowercase phase literal, so content can
 *     be asserted independently of locale.
 *
 * Runs against `next start` (production build) per playwright.config.ts.
 */

const PHASES = ["now", "next", "later", "done"] as const;
type Phase = (typeof PHASES)[number];

// item counts per phase, from content/roadmap.json
const COUNTS: Record<Phase, number> = { now: 2, next: 2, later: 2, done: 1 };

// localized tab labels — used only to prove the locale actually rendered.
const LABELS: Record<"en" | "zh", Record<Phase, string>> = {
  en: { now: "Now", next: "Next", later: "Later", done: "Done" },
  zh: { now: "进行中", next: "接下来", later: "更晚", done: "已完成" },
};

const tablist = (page: Page) => page.getByRole("tablist");

// EN route has no locale prefix: host directly followed by `/roadmap` (so it
// won't accidentally match the ZH `/zh/roadmap`). ZH keeps its `/zh` segment.
const enHashUrl = (phase: Phase) => new RegExp(`//[^/]+/roadmap#${phase}$`);
const zhHashUrl = (phase: Phase) => new RegExp(`/zh/roadmap#${phase}$`);

/**
 * Assert the given phase is the active tab AND the content region shows exactly
 * that phase's items. Content is checked via the lowercase phase-literal pill,
 * so this holds in any locale.
 */
async function assertActive(page: Page, phase: Phase) {
  const tabs = tablist(page).getByRole("tab");
  await expect(tabs).toHaveCount(PHASES.length);
  for (let i = 0; i < PHASES.length; i++) {
    await expect(tabs.nth(i)).toHaveAttribute(
      "aria-selected",
      PHASES[i] === phase ? "true" : "false",
    );
  }
  // Content region: one <article> per item, each carrying the phase pill.
  const articles = page.locator("article");
  await expect(articles).toHaveCount(COUNTS[phase]);
  await expect(articles.getByText(phase, { exact: true })).toHaveCount(
    COUNTS[phase],
  );
}

// ---------------------------------------------------------------------------
// AC1 — click tab → URL hash updates + content switches
// ---------------------------------------------------------------------------
test("AC1: clicking a phase tab updates the URL hash and switches content", async ({
  page,
}) => {
  await page.goto("/en/roadmap");
  await assertActive(page, "now"); // default landing state

  // Click each non-default phase tab in turn; hash + content must follow.
  for (const phase of ["next", "later", "done"] as Phase[]) {
    await tablist(page)
      .getByRole("tab")
      .nth(PHASES.indexOf(phase))
      .click();
    await expect(page).toHaveURL(enHashUrl(phase));
    await assertActive(page, phase);
  }
});

// ---------------------------------------------------------------------------
// AC2 — deep link: loading /roadmap#<phase> lands on that tab
// ---------------------------------------------------------------------------
test("AC2: deep-linking /roadmap#<phase> initialises on that tab", async ({
  page,
}) => {
  // `done` has a distinct item count (1) from the default `now` (2), so this
  // also proves the mount-time hash read actually took effect.
  await page.goto("/en/roadmap#done");
  await assertActive(page, "done");

  await page.goto("/en/roadmap#later");
  await assertActive(page, "later");
});

test("AC2b: an unknown hash falls back to the default tab (no crash)", async ({
  page,
}) => {
  await page.goto("/en/roadmap#bogus");
  await assertActive(page, "now");
});

// ---------------------------------------------------------------------------
// AC3 — browser back/forward navigates phases via the hashchange listener
// ---------------------------------------------------------------------------
test("AC3: browser back/forward keeps tab + content in sync with the hash", async ({
  page,
}) => {
  await page.goto("/en/roadmap");
  await assertActive(page, "now");

  // hash assignment pushes a real history entry and fires `hashchange`.
  await page.evaluate(() => {
    window.location.hash = "next";
  });
  await assertActive(page, "next");
  await page.evaluate(() => {
    window.location.hash = "later";
  });
  await assertActive(page, "later");

  await page.goBack();
  await expect(page).toHaveURL(/#next$/);
  await assertActive(page, "next");

  await page.goForward();
  await expect(page).toHaveURL(/#later$/);
  await assertActive(page, "later");
});

// ---------------------------------------------------------------------------
// AC4 — ZH locale behaves identically (switching locale doesn't break sync)
// ---------------------------------------------------------------------------
test("AC4: ZH locale — deep-link, tab click, and hash sync all work", async ({
  page,
}) => {
  await page.goto("/zh/roadmap#next");

  // Confirm we really rendered the ZH locale (labels are translated)...
  await expect(
    tablist(page).getByRole("tab").nth(PHASES.indexOf("now")),
  ).toContainText(LABELS.zh.now);
  // ...and the deep-link still resolved to the right phase.
  await assertActive(page, "next");

  // Clicking a tab updates the hash on the ZH route.
  await tablist(page)
    .getByRole("tab")
    .nth(PHASES.indexOf("later"))
    .click();
  await expect(page).toHaveURL(zhHashUrl("later"));
  await assertActive(page, "later");

  // back/forward sync holds under ZH too. Tab clicks use replaceState (no new
  // history entry by design), so drive history via a hash assignment — that
  // pushes a real entry, then back returns to the prior phase.
  await page.evaluate(() => {
    window.location.hash = "done";
  });
  await assertActive(page, "done");
  await page.goBack();
  await expect(page).toHaveURL(zhHashUrl("later"));
  await assertActive(page, "later");
});
