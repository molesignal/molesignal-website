/**
 * Verifies the changelog "real GitHub Release" data path for ISSUE-21 (T20).
 *
 * T07 (ISSUE-7) already proved the empty/previewing fallback. This script
 * proves the OTHER half — when getReleases() returns real releases, the page
 * data path, the RSS feed path, and the version anchors all agree:
 *
 *   AC1  ISR real pull   — getReleases() → releaseToChangelogMeta() yields
 *                          correct version / date / sorted items / prose /
 *                          htmlUrl / prerelease, no NaN / empty noise;
 *   AC2  RSS same-source — collectChangelogFeedItems() (same getReleases call)
 *                          has the same count and, sorted newest-first, the
 *                          same version sequence as the page entries;
 *   AC3  anchor parity   — versionAnchor() is the single rule, and the three
 *                          render sites (entry id / nav href / RSS link+guid)
 *                          all import it instead of re-hardcoding the regex;
 *                          pre-release tags (`0.7.0-rc.1`→`v0-7-0-rc-1`) agree;
 *   AC4  prerelease flag — prerelease releases carry prerelease=true, stable
 *                          ones false (the page/RSS Pill render is E2E's job);
 *   AC5  fallback intact — on !ok / throw, getReleases() === [] and the feed
 *                          falls back to the static CHANGELOG (count + versions
 *                          match content/changelog.ts), same as T07;
 *   AC6  edge robustness — empty body / prose-only / name===tag don't throw,
 *                          produce empty items / undefined title cleanly.
 *
 * Network is fully stubbed (global fetch is replaced) so this runs offline and
 * needs no GITHUB_TOKEN or live repo — the degraded-verification path the
 * READINESS policy accepts for T20's [x] (real token + real Release deferred
 * to AC8).
 *
 * Usage:  pnpm test:changelog   (exits 0 on success, 1 on any failed assertion)
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CHANGELOG } from "../content/changelog";
import { versionAnchor } from "../lib/changelog-anchor";
import { collectChangelogFeedItems, sortFeedNewestFirst } from "../lib/changelog-feed";
import { getReleases } from "../lib/github";
import { releaseToChangelogMeta } from "../lib/parse-release";

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${msg}`);
  }
}

type FetchImpl = typeof fetch;
const realFetch = globalThis.fetch;

function installFetch(impl: (url: string) => unknown): void {
  globalThis.fetch = ((input: string | URL | Request) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return Promise.resolve(impl(url));
  }) as FetchImpl;
}

function restoreFetch(): void {
  globalThis.fetch = realFetch;
}

function jsonResponse(
  ok: boolean,
  body: unknown,
): { ok: boolean; json: () => Promise<unknown> } {
  return { ok, json: () => Promise.resolve(body) };
}

// ── Raw GitHub Release fixtures (the shape the real API returns) ────────────
// Deliberately UN-sorted by date so the newest-first assertions have teeth.
const RELEASES_FIXTURE = [
  {
    // pre-release, newest → must sort to the top; name:null
    tag_name: "v0.8.0-rc.1",
    name: null,
    published_at: "2026-05-25T00:00:00Z",
    created_at: "2026-05-25T00:00:00Z",
    body: "- chore: cut release candidate for the 0.8 line",
    html_url:
      "https://github.com/molesignal/molesignal/releases/tag/v0.8.0-rc.1",
    draft: false,
    prerelease: true,
  },
  {
    // stable, structured items (out of TAG_ORDER on purpose) + prose remainder
    tag_name: "v0.9.0",
    name: "v0.9.0 — Teal brand",
    published_at: "2026-05-20T00:00:00Z",
    created_at: "2026-05-20T00:00:00Z",
    body: [
      "### Highlights",
      "- fix(core): tenant span leak under racy ingest",
      "- feat: cross-signal correlation jumps preserve time window",
      "- perf: parquet column pruning shaves 18% off log latency",
      "- breaking: rename metadata.psql → metadata.postgres.dsn",
      "",
      "Upgrade notes: run the schema migration before rollout.",
    ].join("\n"),
    html_url: "https://github.com/molesignal/molesignal/releases/tag/v0.9.0",
    draft: false,
    prerelease: false,
  },
  {
    // draft → MUST be filtered out entirely
    tag_name: "v1.0.0-draft",
    name: "wip",
    published_at: null,
    created_at: "2026-05-30T00:00:00Z",
    body: "- feat: not published yet",
    html_url:
      "https://github.com/molesignal/molesignal/releases/tag/v1.0.0-draft",
    draft: true,
    prerelease: false,
  },
  {
    // edge: empty body + name === tag → title should be undefined, items []
    tag_name: "v0.6.0",
    name: "v0.6.0",
    published_at: "2026-04-01T00:00:00Z",
    created_at: "2026-04-01T00:00:00Z",
    body: "",
    html_url: "https://github.com/molesignal/molesignal/releases/tag/v0.6.0",
    draft: false,
    prerelease: false,
  },
  {
    // edge: prose-only (no structured `- feat:` lines) → items [], prose kept
    tag_name: "v0.5.0",
    name: null,
    published_at: "2026-03-01T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
    body: "Just some narrative notes without any conventional-commit bullets.",
    html_url: "https://github.com/molesignal/molesignal/releases/tag/v0.5.0",
    draft: false,
    prerelease: false,
  },
];

function installReleasesFixture(): void {
  installFetch((url) => {
    if (url.includes("/releases")) return jsonResponse(true, RELEASES_FIXTURE);
    return jsonResponse(true, []);
  });
}

const TAG_RANK: Record<string, number> = {
  breaking: 0,
  feat: 1,
  fix: 2,
  perf: 3,
  chore: 4,
};

async function run(): Promise<void> {
  // ── AC1 — real ISR pull → ChangelogMeta is correct, no NaN / empty ───────
  console.log("changelog · AC1 real release → page entries");
  installReleasesFixture();

  const releases = await getReleases(30);
  assert(releases.length === 4, "getReleases() drops the draft (4 of 5 kept)");
  assert(
    releases.every((r) => r.tag.startsWith("v")),
    "kept releases preserve the leading-v tag",
  );

  const entries = releases.map((r) => releaseToChangelogMeta(r));

  const stable = entries.find((e) => e.meta.version === "0.9.0");
  assert(!!stable, "stable v0.9.0 present (version strips leading v)");
  if (stable) {
    assert(
      stable.meta.title === "v0.9.0 — Teal brand",
      "custom release name surfaces as title (name !== tag)",
    );
    assert(
      stable.meta.items.length === 4,
      "all 4 structured items parsed (feat/fix/perf/breaking)",
    );
    const ranks = stable.meta.items.map((it) => TAG_RANK[it.tag]);
    assert(
      ranks.every((r, i) => i === 0 || ranks[i - 1] <= r),
      "items sorted by TAG_ORDER (breaking→feat→fix→perf→chore)",
    );
    assert(
      stable.meta.items[0]?.tag === "breaking",
      "breaking item floats to the top after sort",
    );
    assert(
      stable.prose.includes("Upgrade notes"),
      "prose remainder retains non-bullet text",
    );
    assert(
      !stable.prose.includes("Highlights"),
      "section header (### Highlights) dropped from prose",
    );
    assert(
      stable.htmlUrl ===
        "https://github.com/molesignal/molesignal/releases/tag/v0.9.0",
      "htmlUrl passed through for the GitHub external link",
    );
    assert(stable.prerelease === false, "stable release prerelease === false");
    assert(
      !Number.isNaN(+new Date(stable.meta.date)),
      "entry date is a valid timestamp (no NaN)",
    );
    assert(
      stable.meta.items.every((it) => it.text.trim().length > 0),
      "no empty item text rendered",
    );
  }

  // ── AC4 — prerelease flag carried through ────────────────────────────────
  console.log("changelog · AC4 prerelease flag");
  const rc = entries.find((e) => e.meta.version === "0.8.0-rc.1");
  assert(!!rc, "pre-release v0.8.0-rc.1 is present (not hidden)");
  assert(rc?.prerelease === true, "pre-release carries prerelease === true");
  assert(
    entries.filter((e) => e.prerelease).length === 1,
    "exactly one entry flagged pre-release (no false positives)",
  );

  // ── AC6 — edge bodies don't throw / produce clean output ─────────────────
  console.log("changelog · AC6 edge robustness");
  const emptyBody = entries.find((e) => e.meta.version === "0.6.0");
  assert(emptyBody?.meta.items.length === 0, "empty body → items === []");
  assert(
    emptyBody?.meta.title === undefined,
    "name === tag → title undefined (no redundant heading)",
  );
  assert(emptyBody?.prose === "", "empty body → prose === '' (no noise)");
  const proseOnly = entries.find((e) => e.meta.version === "0.5.0");
  assert(
    proseOnly?.meta.items.length === 0,
    "prose-only body → items === [] (no phantom pills)",
  );
  assert(
    proseOnly?.prose.startsWith("Just some narrative") ?? false,
    "prose-only body → prose preserved verbatim",
  );

  // ── AC2 — RSS feed is same-source, same-count, same-order as the page ─────
  console.log("changelog · AC2 RSS same-source / same-order");
  const feed = await collectChangelogFeedItems();
  assert(
    feed.length === entries.length,
    `RSS item count (${feed.length}) === page entry count (${entries.length})`,
  );
  const pageOrder = sortFeedNewestFirst(
    entries.map((e) => ({ version: e.meta.version, date: e.meta.date })),
  ).map((e) => e.version);
  const feedOrder = sortFeedNewestFirst(feed).map((f) => f.version);
  assert(
    JSON.stringify(pageOrder) === JSON.stringify(feedOrder),
    `same version sequence newest-first: ${feedOrder.join(", ")}`,
  );
  assert(
    feedOrder[0] === "0.8.0-rc.1" && feedOrder[feedOrder.length - 1] === "0.5.0",
    "newest-first order is correct (rc.1 at 05-25 → 0.5.0 at 03-01)",
  );

  // ── AC3 — version anchors agree across all three render sites ─────────────
  console.log("changelog · AC3 anchor parity");
  assert(versionAnchor("0.9.0") === "v0-9-0", 'versionAnchor("0.9.0") → "v0-9-0"');
  assert(
    versionAnchor("0.8.0-rc.1") === "v0-8-0-rc-1",
    'pre-release anchor: "0.8.0-rc.1" → "v0-8-0-rc-1"',
  );
  // The three sites must DERIVE anchors from the shared helper, not re-hardcode
  // the dot→dash regex (the AC3 drift root-cause the helper exists to kill).
  const SITES = [
    "components/changelog-entry.tsx",
    "app/[locale]/changelog/page.tsx",
    "app/changelog/rss.xml/route.ts",
  ];
  for (const rel of SITES) {
    const src = readFileSync(join(process.cwd(), rel), "utf8");
    assert(/versionAnchor\s*\(/.test(src), `${rel} calls versionAnchor()`);
    assert(
      !/replace\(\s*\/\\\.\/g/.test(src),
      `${rel} no longer hardcodes the anchor regex`,
    );
  }

  restoreFetch();

  // ── AC5 — fallback path unchanged (non-ok and throw) ─────────────────────
  console.log("changelog · AC5 fallback not degraded");
  installFetch(() => jsonResponse(false, { message: "rate limit exceeded" }));
  assert((await getReleases()).length === 0, "getReleases() === [] on !ok");
  let fallbackFeed = await collectChangelogFeedItems();
  assert(
    fallbackFeed.length === CHANGELOG.length,
    "RSS falls back to static CHANGELOG on !ok (count matches)",
  );
  assert(
    JSON.stringify(fallbackFeed.map((f) => f.version)) ===
      JSON.stringify(CHANGELOG.map((c) => c.version)),
    "fallback feed versions match content/changelog.ts exactly",
  );

  installFetch(() => {
    throw new Error("network down");
  });
  assert((await getReleases()).length === 0, "getReleases() === [] on throw");
  fallbackFeed = await collectChangelogFeedItems();
  assert(
    fallbackFeed.length === CHANGELOG.length,
    "RSS falls back to static CHANGELOG on throw (no fabrication)",
  );

  restoreFetch();
}

run()
  .catch((err) => {
    restoreFetch();
    console.error(err);
    failures += 1;
  })
  .finally(() => {
    if (failures > 0) {
      console.error(`\n${failures} assertion(s) failed.`);
      process.exit(1);
    }
    console.log("\nAll changelog real-release checks passed.");
  });
