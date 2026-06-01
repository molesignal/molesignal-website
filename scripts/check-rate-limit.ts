/**
 * Verifies the rate limiter's no-key (in-memory fallback) and fail-open paths
 * without needing real Upstash credentials. Covers AC2/AC4/AC5/AC6 of ISSUE-1.
 *
 * Usage:
 *   pnpm test:rate-limit
 *
 * The script runs in two modes:
 *   - default       : asserts the in-memory fallback enforces the limit and
 *                     computes a non-negative integer Retry-After.
 *   - --fail-open   : re-spawned as a child with bogus UPSTASH_* env so the
 *                     Upstash client errors at runtime; asserts the request is
 *                     allowed (fail-open) instead of throwing / returning 5xx.
 *
 * Exits 0 on success, 1 on any failed assertion.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${msg}`);
  }
}

function retryAfterSeconds(resetAt: number): number {
  return Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
}

async function testMemoryFallback(): Promise<void> {
  // Ensure we're on the fallback path: no Upstash env in this process.
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const { rateLimit } = await import("../lib/rate-limit");

  console.log("[memory-fallback] cloud-waitlist 10/h, design-partner 5/h");

  const cases = [
    { form: "cloud-waitlist", max: 10 },
    { form: "design-partner", max: 5 },
  ];
  const windowMs = 60 * 60 * 1000;

  for (const { form, max } of cases) {
    // Unique key per run-of-this-test so cases don't interfere.
    const key = `${form}:test-ip`;
    let lastRemaining = Infinity;
    let allOkWithinLimit = true;
    let remainingMonotonic = true;

    for (let i = 1; i <= max; i++) {
      const r = await rateLimit({ key, max, windowMs });
      if (!r.ok) allOkWithinLimit = false;
      if (r.remaining >= lastRemaining) remainingMonotonic = false;
      lastRemaining = r.remaining;
    }

    assert(allOkWithinLimit, `${form}: first ${max} requests all ok`);
    assert(
      remainingMonotonic,
      `${form}: remaining strictly decreases across the window`,
    );
    assert(lastRemaining === 0, `${form}: remaining reaches 0 at the limit`);

    // The (max+1)th request must be rejected with a valid Retry-After.
    const over = await rateLimit({ key, max, windowMs });
    assert(over.ok === false, `${form}: request #${max + 1} is rejected (429)`);
    const ra = retryAfterSeconds(over.resetAt);
    assert(
      Number.isInteger(ra) && ra >= 0,
      `${form}: Retry-After is a non-negative integer (${ra}s)`,
    );
  }
}

async function testFailOpen(): Promise<void> {
  // Bogus-but-well-formed Upstash env was injected by the parent. The client
  // will fail to reach the host; rateLimit must fail open.
  const { rateLimit } = await import("../lib/rate-limit");

  console.log("[fail-open] Upstash unreachable → request must be allowed");

  const r = await rateLimit({
    key: "cloud-waitlist:fail-open-ip",
    max: 10,
    windowMs: 60 * 60 * 1000,
  });

  assert(r.ok === true, "request allowed despite Upstash error (fail-open)");
  assert(r.remaining >= 0, "remaining is non-negative on fail-open");
  assert(r.resetAt > Date.now(), "resetAt is in the future on fail-open");
}

async function main(): Promise<void> {
  if (process.argv.includes("--fail-open")) {
    await testFailOpen();
    process.exit(failures === 0 ? 0 : 1);
  }

  await testMemoryFallback();

  // Spawn a child with bogus Upstash creds to exercise the fail-open branch
  // (env must be present at module load, so it needs a separate process).
  console.log("\n[fail-open] spawning child with bogus UPSTASH_* env…");
  const tsxBin = path.resolve(
    process.cwd(),
    "node_modules/.bin/tsx",
  );
  const selfPath = path.resolve(process.cwd(), "scripts/check-rate-limit.ts");
  const child = spawnSync(tsxBin, [selfPath, "--fail-open"], {
    env: {
      ...process.env,
      UPSTASH_REDIS_REST_URL: "https://127.0.0.1:1",
      UPSTASH_REDIS_REST_TOKEN: "bogus-token-for-fail-open-test",
    },
    stdio: "inherit",
  });
  if (child.status !== 0) failures += 1;

  console.log("");
  if (failures === 0) {
    console.log("✅ rate-limit checks passed");
    process.exit(0);
  } else {
    console.error(`❌ ${failures} rate-limit check(s) failed`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("check-rate-limit crashed:", err);
  process.exit(1);
});
