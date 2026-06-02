/**
 * Verifies the contributor-wall *render path* for ISSUE-17 (T16).
 *
 * T07's `pnpm test:github` already guards the data-source fallback contracts
 * (network error / 403 / 404 → [], bot filtering in `getContributors`). This
 * script covers what that one couldn't: the real-data render path. Because
 * `ContributorWall` is a server component that `await getContributors()`, a
 * browser E2E can't intercept the fetch to inject a fixture — so the field
 * mapping, ordering, per-size cap and accessible name were never objectively
 * asserted. The pure `buildContributorWallItems` view-model makes them testable
 * here without a DOM renderer.
 *
 * Usage:
 *   pnpm test:contributor-wall
 *
 * Exits 0 on success, 1 on any failed assertion.
 */

import {
  buildContributorWallItems,
  CONTRIBUTOR_WALL_LIMIT,
} from "../lib/contributor-wall";
import { getContributors, type Contributor } from "../lib/github";

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

// Two real Users in descending-contribution order, like the GitHub default.
const USER_FIXTURE: Contributor[] = [
  {
    login: "alice",
    avatar_url: "https://avatars.example.com/alice.png",
    html_url: "https://github.com/alice",
    contributions: 128,
  },
  {
    login: "bob",
    avatar_url: "https://avatars.example.com/bob.png",
    html_url: "https://github.com/bob",
    contributions: 17,
  },
];

async function run(): Promise<void> {
  // ── AC1 real-data render: src/href map straight from the contributor ─────
  console.log("contributor-wall · AC1 real-data render (src/href mapping)");
  const items = buildContributorWallItems(USER_FIXTURE, "default");
  assert(items.length === 2, "renders one item per real User");
  assert(
    items[0]?.src === USER_FIXTURE[0]?.avatar_url &&
      items[1]?.src === USER_FIXTURE[1]?.avatar_url,
    "<img> src === contributor.avatar_url",
  );
  assert(
    items[0]?.href === USER_FIXTURE[0]?.html_url &&
      items[1]?.href === USER_FIXTURE[1]?.html_url,
    "<a> href === contributor.html_url",
  );

  // ── AC2 ordering + per-size cap ──────────────────────────────────────────
  console.log("contributor-wall · AC2 ordering + per-size cap");
  assert(
    items[0]?.login === "alice" && items[1]?.login === "bob",
    "order preserved (GitHub's descending-contribution order)",
  );
  // 40 inputs → compact caps at 12, default caps at 30, never over-renders.
  const many: Contributor[] = Array.from({ length: 40 }, (_, i) => ({
    login: `user${i}`,
    avatar_url: `https://avatars.example.com/${i}.png`,
    html_url: `https://github.com/user${i}`,
    contributions: 40 - i,
  }));
  const compact = buildContributorWallItems(many, "compact");
  const def = buildContributorWallItems(many, "default");
  assert(
    compact.length === CONTRIBUTOR_WALL_LIMIT.compact && compact.length === 12,
    "compact caps at 12",
  );
  assert(
    def.length === CONTRIBUTOR_WALL_LIMIT.default && def.length === 30,
    "default caps at 30",
  );
  assert(
    compact[0]?.login === "user0" && compact[11]?.login === "user11",
    "compact keeps the first 12 in order (top contributors)",
  );

  // ── AC3 bot filtering is honored end-to-end (getContributors → view) ─────
  console.log(
    "contributor-wall · AC3 bot filtering (render layer does not bypass)",
  );
  installFetch((url) => {
    if (url.includes("/contributors")) {
      return jsonResponse(true, [
        {
          login: "alice",
          avatar_url: "https://avatars.example.com/alice.png",
          html_url: "https://github.com/alice",
          contributions: 128,
          type: "User",
        },
        {
          login: "github-actions[bot]",
          avatar_url: "https://avatars.example.com/ghbot.png",
          html_url: "https://github.com/apps/github-actions",
          contributions: 99,
          type: "Bot",
        },
        {
          login: "molesignal",
          avatar_url: "https://avatars.example.com/org.png",
          html_url: "https://github.com/molesignal",
          contributions: 50,
          type: "Organization",
        },
      ]);
    }
    return jsonResponse(true, {});
  });
  const fetched = await getContributors(30);
  const fetchedItems = buildContributorWallItems(fetched, "default");
  restoreFetch();
  assert(
    fetchedItems.length === 1 && fetchedItems[0]?.login === "alice",
    "Bot + Organization entries never reach the wall",
  );

  // ── AC4 identity readable: title has login+contributions, ariaLabel has login
  console.log("contributor-wall · AC4 title + accessible name");
  assert(
    items[0]?.title.includes("alice") && items[0]?.title.includes("128"),
    "title contains login and contribution count",
  );
  const labelled = buildContributorWallItems(
    USER_FIXTURE,
    "default",
    (login) => `${login} 的 GitHub 主页`,
  );
  assert(
    labelled[0]?.ariaLabel === "alice 的 GitHub 主页" &&
      labelled[0]?.ariaLabel.includes("alice"),
    "ariaLabel is built from the injected i18n formatter and contains login",
  );
  assert(
    items[0]?.ariaLabel.includes("alice"),
    "default ariaLabel contains login (screen-reader name present)",
  );

  // ── AC5 empty state: no items, no fabricated avatars ─────────────────────
  console.log("contributor-wall · AC5 empty-state branch");
  assert(
    buildContributorWallItems([], "default").length === 0 &&
      buildContributorWallItems([], "compact").length === 0,
    "empty contributors → [] (UI renders the bilingual empty state, no broken img)",
  );
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
    console.log("\nAll contributor-wall render checks passed.");
  });
