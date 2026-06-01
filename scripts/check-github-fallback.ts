/**
 * Verifies the GitHub data-source fallback contracts for ISSUE-7 (T07):
 *   - getRepoStats() returns the honest fallback (fallback:true, stars:0,
 *     lastCommitISO:null) on network error AND on a non-ok response
 *     (e.g. 403 rate limit / 404 private-or-missing repo) — never a fake number;
 *   - getReleases() / getContributors() degrade to [] on the same failures,
 *     so the changelog renders the "previewing" static fallback and the
 *     contributor wall renders the "Be the first contributor" empty state;
 *   - when the repo is public + the API responds 200 (the GITHUB_TOKEN /
 *     public-repo path), the SAME code parses real data with fallback:false —
 *     proving the auto-switch happens with no code change (AC5);
 *   - contributors filter out bot accounts (type !== "User");
 *   - formatStars / timeAgo never emit a misleading value.
 *
 * Network is fully stubbed (global fetch is replaced) so this runs offline
 * and gives QA an objective check of the fallback states without any external
 * key or live repo.
 *
 * Usage:
 *   pnpm test:github
 *
 * Exits 0 on success, 1 on any failed assertion.
 */

import {
  formatStars,
  getContributors,
  getReleases,
  getRepoStats,
  timeAgo,
} from "../lib/github";

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

function jsonResponse(ok: boolean, body: unknown): { ok: boolean; json: () => Promise<unknown> } {
  return { ok, json: () => Promise.resolve(body) };
}

async function run(): Promise<void> {
  // ── 1. Network error → honest fallback, no fake numbers ──────────────────
  console.log("github · network error → fallback (no fabricated data)");
  installFetch(() => {
    throw new Error("network down");
  });
  let stats = await getRepoStats();
  assert(stats.fallback === true, "getRepoStats().fallback === true on throw");
  assert(stats.stars === 0, "getRepoStats().stars === 0 (no fake count)");
  assert(stats.lastCommitISO === null, "getRepoStats().lastCommitISO === null");
  assert(
    (await getReleases()).length === 0,
    "getReleases() === [] on throw (→ changelog 'previewing' fallback)",
  );
  assert(
    (await getContributors()).length === 0,
    "getContributors() === [] on throw (→ 'Be the first contributor' empty state)",
  );

  // ── 2. Non-ok response (403 rate limit / 404 private repo) → fallback ────
  console.log("github · non-ok response (403/404) → fallback");
  installFetch(() => jsonResponse(false, { message: "rate limit exceeded" }));
  stats = await getRepoStats();
  assert(stats.fallback === true, "getRepoStats().fallback === true on !ok");
  assert(stats.stars === 0, "getRepoStats().stars === 0 on !ok");
  assert(
    (await getReleases()).length === 0,
    "getReleases() === [] on !ok",
  );
  assert(
    (await getContributors()).length === 0,
    "getContributors() === [] on !ok",
  );

  // ── 3. Public repo + 200 → auto-switch to real data, no code change (AC5) ─
  console.log("github · 200 OK (public repo / token) → real data, fallback:false");
  installFetch((url) => {
    if (url.includes("/commits")) {
      return jsonResponse(true, [
        { commit: { author: { date: "2026-05-30T12:00:00Z" } } },
      ]);
    }
    if (url.includes("/releases")) {
      return jsonResponse(true, [
        {
          tag_name: "v0.8.0",
          name: "v0.8.0 — Teal brand",
          published_at: "2026-05-12T00:00:00Z",
          created_at: "2026-05-12T00:00:00Z",
          body: "- feat: cross-signal correlation\n- fix(core): tenant leak",
          html_url: "https://github.com/molesignal/molesignal/releases/tag/v0.8.0",
          draft: false,
          prerelease: false,
        },
        {
          tag_name: "v0.9.0-rc.1",
          name: null,
          published_at: null,
          created_at: "2026-05-20T00:00:00Z",
          body: "- chore: rc",
          html_url: "https://github.com/molesignal/molesignal/releases/tag/v0.9.0-rc.1",
          draft: true, // drafts must be dropped
          prerelease: true,
        },
      ]);
    }
    if (url.includes("/contributors")) {
      return jsonResponse(true, [
        {
          login: "alice",
          avatar_url: "https://example.com/a.png",
          html_url: "https://github.com/alice",
          contributions: 42,
          type: "User",
        },
        {
          login: "dependabot[bot]",
          avatar_url: "https://example.com/bot.png",
          html_url: "https://github.com/apps/dependabot",
          contributions: 9,
          type: "Bot", // must be filtered out
        },
      ]);
    }
    // repo metadata
    return jsonResponse(true, { stargazers_count: 1234 });
  });

  stats = await getRepoStats();
  assert(stats.fallback === false, "getRepoStats().fallback === false on 200");
  assert(stats.stars === 1234, "getRepoStats() parses real star count");
  assert(
    stats.lastCommitISO === "2026-05-30T12:00:00Z",
    "getRepoStats() parses last commit ISO",
  );

  const releases = await getReleases();
  assert(releases.length === 1, "getReleases() drops drafts (1 of 2 kept)");
  assert(releases[0]?.version === "0.8.0", "release version strips leading v");
  assert(
    releases[0]?.tag === "v0.8.0",
    "release tag preserves leading v",
  );

  const contributors = await getContributors();
  assert(
    contributors.length === 1 && contributors[0]?.login === "alice",
    "getContributors() filters out non-User (bot) accounts",
  );

  restoreFetch();

  // ── 4. Pure formatters never mislead ─────────────────────────────────────
  console.log("github · formatters");
  assert(formatStars(0) === "0", 'formatStars(0) === "0"');
  assert(formatStars(999) === "999", 'formatStars(999) === "999"');
  assert(formatStars(1234) === "1.2k", 'formatStars(1234) === "1.2k"');
  assert(formatStars(1_500_000) === "1.5M", 'formatStars(1.5M) === "1.5M"');
  assert(timeAgo(null) === "—", 'timeAgo(null) === "—" (no fake recency)');
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
    console.log("\nAll github fallback checks passed.");
  });
