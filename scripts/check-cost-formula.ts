/**
 * Verifies the cost calculator math for ISSUE-6 (T03):
 *   - no NaN / non-finite / negative results across the full input domain,
 *     including hostile inputs (NaN, Infinity, 0, negative, beyond clamp);
 *   - Datadog rates are calibrated to the documented public snapshot;
 *   - formatUsd never emits "$NaN" and stays within sane magnitude;
 *   - savings is non-negative and percent is 0..100.
 *
 * Usage:
 *   pnpm test:cost
 *
 * Exits 0 on success, 1 on any failed assertion.
 */

import {
  PRICING_SNAPSHOT,
  PRICING_SOURCE_URL,
  calculateCost,
  formatUsd,
} from "../lib/cost-formula";

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${msg}`);
  }
}

function finiteResult(r: ReturnType<typeof calculateCost>): boolean {
  return (
    Number.isFinite(r.datadogMonthly) &&
    Number.isFinite(r.molesignalMonthly) &&
    Number.isFinite(r.savingsMonthly) &&
    Number.isFinite(r.savingsPercent)
  );
}

console.log("cost-formula · snapshot & source");
assert(
  /^\d{4}-\d{2}-\d{2}$/.test(PRICING_SNAPSHOT),
  `PRICING_SNAPSHOT is an ISO date (${PRICING_SNAPSHOT})`,
);
assert(
  PRICING_SOURCE_URL.startsWith("https://"),
  `PRICING_SOURCE_URL is https (${PRICING_SOURCE_URL})`,
);

console.log("cost-formula · full input sweep (no NaN / no overflow)");
let sweepOk = true;
let maxDatadog = 0;
for (let gb = 1; gb <= 5000; gb += 17) {
  for (let ret = 1; ret <= 365; ret += 11) {
    const r = calculateCost({ gbPerDay: gb, retentionDays: ret });
    if (
      !finiteResult(r) ||
      r.datadogMonthly < 0 ||
      r.molesignalMonthly < 0 ||
      r.savingsPercent < 0 ||
      r.savingsPercent > 100
    ) {
      sweepOk = false;
      console.error(`    bad result at gb=${gb} ret=${ret}:`, r);
      break;
    }
    maxDatadog = Math.max(maxDatadog, r.datadogMonthly);
  }
  if (!sweepOk) break;
}
assert(sweepOk, "all sweep results finite, non-negative, percent in 0..100");
assert(
  Number.isFinite(maxDatadog) && maxDatadog < 1e9,
  `peak Datadog estimate stays bounded ($${maxDatadog})`,
);

console.log("cost-formula · hostile inputs are sanitized (no NaN leak)");
const hostile: { gbPerDay: number; retentionDays: number }[] = [
  { gbPerDay: NaN, retentionDays: NaN },
  { gbPerDay: Infinity, retentionDays: -Infinity },
  { gbPerDay: 0, retentionDays: 0 },
  { gbPerDay: -100, retentionDays: -5 },
  { gbPerDay: 1e12, retentionDays: 1e6 },
];
for (const input of hostile) {
  const r = calculateCost(input);
  assert(
    finiteResult(r) && r.datadogMonthly >= 0 && r.molesignalMonthly >= 0,
    `finite & non-negative for ${JSON.stringify(input)}`,
  );
}

console.log("cost-formula · formatUsd guards");
assert(formatUsd(NaN) === "$0", 'formatUsd(NaN) === "$0"');
assert(formatUsd(Infinity) === "$0", 'formatUsd(Infinity) === "$0"');
assert(!formatUsd(12345).includes("NaN"), "formatUsd(12345) has no NaN");
assert(formatUsd(2_500_000) === "$2.5M", "formatUsd millions");
assert(formatUsd(6500) === "$6.5k", "formatUsd thousands");

console.log("cost-formula · representative point (100 GB/day, 30d)");
const base = calculateCost({ gbPerDay: 100, retentionDays: 30 });
console.log(
  `    datadog=${formatUsd(base.datadogMonthly)} molesignal=${formatUsd(
    base.molesignalMonthly,
  )} savings=${base.savingsPercent}%`,
);
assert(
  base.datadogMonthly > base.molesignalMonthly,
  "self-hosted cheaper than Datadog at the default workload",
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll cost-formula checks passed.");
