/**
 * Contract guard for the comparison table data source (ISSUE-23 / T22).
 *
 * `lib/compare-data.ts` (COMPARE_ROWS) is the single source of truth for the
 * Home (slim) and /why (full) comparison tables; `components/compare-table.tsx`
 * is a pure renderer that looks up the dimension label / detail via i18n keys
 * `components.compareTable.rows.*`. That split means a row's text lives in THREE
 * places — the TS data, messages/en.json, messages/zh.json — and nothing today
 * catches a missing/orphan i18n key, a `hasDetail:true` with no Detail string,
 * or a mistyped verdict until next-intl throws (or renders a raw key) at runtime.
 *
 * This script makes the implicit data↔i18n↔type contract explicit and
 * machine-checked. It asserts, for COMPARE_ROWS:
 *
 *   AC3① every `rows.<id>` exists and is non-empty in BOTH en.json and zh.json;
 *   AC3② `rows.<id>Detail` exists in both locales IFF `hasDetail === true`
 *        (absent/false rows must NOT carry a Detail key);
 *   AC3③ no orphan keys — under `components.compareTable.rows.*` every key maps
 *        to a known row `id` or `<id>Detail`, and en/zh are symmetric;
 *   AC3④ every cell.verdict ∈ {good,mixed,bad,neutral}; every cell.value is a
 *        non-empty string;
 *   AC3⑤ every `id` is unique, non-empty, and safe as a React key;
 *   AC3⑥ the `cost` row dollar floor is NOT contradicted by lib/cost-formula
 *        (the modeled Datadog bill at the row's stated workload clears the
 *        stated lower bound). T03 owns the actual pricing; this only catches a
 *        floor that drifts BELOW what the snapshot model produces.
 *
 * No new dependencies: messages are read via readFileSync + JSON.parse, same as
 * scripts/check-i18n-parity.ts. Run with `pnpm test:compare` (tsx).
 *
 * Usage:  pnpm test:compare   (exits 0 on success, 1 on any failed assertion)
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { COMPARE_ROWS, type CompareCell } from "../lib/compare-data";
import { calculateCost, PRICING_SNAPSHOT } from "../lib/cost-formula";

const HERE = dirname(fileURLToPath(import.meta.url));
const MESSAGES = resolve(HERE, "..", "messages");

let failures = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${msg}`);
  }
}

type Json = { [k: string]: string | Json };

function loadRows(file: string): Record<string, string> {
  const root = JSON.parse(readFileSync(resolve(MESSAGES, file), "utf8")) as Json;
  const components = root.components;
  const compareTable =
    components && typeof components !== "string"
      ? (components.compareTable as Json | undefined)
      : undefined;
  const rows =
    compareTable && typeof compareTable !== "string"
      ? (compareTable.rows as Json | undefined)
      : undefined;
  if (!rows || typeof rows === "string") {
    throw new Error(`${file}: components.compareTable.rows is missing`);
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(rows)) {
    if (typeof v !== "string") {
      throw new Error(`${file}: components.compareTable.rows.${k} is not a string`);
    }
    out[k] = v;
  }
  return out;
}

const VERDICTS: ReadonlyArray<CompareCell["verdict"]> = [
  "good",
  "mixed",
  "bad",
  "neutral",
];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

const en = loadRows("en.json");
const zh = loadRows("zh.json");

// ── AC3⑤ — ids are unique, non-empty, React-key-safe ───────────────────────
console.log("compare · AC3⑤ ids unique / non-empty");
const ids = COMPARE_ROWS.map((r) => r.id);
assert(
  ids.every((id) => isNonEmptyString(id)),
  "every row id is a non-empty string",
);
assert(new Set(ids).size === ids.length, "all row ids are unique");
assert(
  ids.every((id) => /^[A-Za-z][A-Za-z0-9]*$/.test(id)),
  "row ids are simple identifiers (safe i18n key + React key)",
);

// ── AC3④ — verdicts legal, values non-empty ────────────────────────────────
console.log("compare · AC3④ verdict / value validity");
for (const row of COMPARE_ROWS) {
  for (const [col, cell] of Object.entries({
    saas: row.saas,
    oss: row.oss,
    molesignal: row.molesignal,
  })) {
    assert(
      (VERDICTS as readonly string[]).includes(cell.verdict),
      `${row.id}.${col}.verdict "${cell.verdict}" is one of ${VERDICTS.join("/")}`,
    );
    assert(
      isNonEmptyString(cell.value),
      `${row.id}.${col}.value is a non-empty string`,
    );
  }
}

// ── AC3① / AC3② — i18n label + Detail keys present per locale ───────────────
console.log("compare · AC3① label keys present (en + zh, non-empty)");
for (const row of COMPARE_ROWS) {
  assert(isNonEmptyString(en[row.id]), `en rows.${row.id} present + non-empty`);
  assert(isNonEmptyString(zh[row.id]), `zh rows.${row.id} present + non-empty`);
}

console.log("compare · AC3② Detail keys iff hasDetail === true");
for (const row of COMPARE_ROWS) {
  const detailKey = `${row.id}Detail`;
  if (row.hasDetail === true) {
    assert(
      isNonEmptyString(en[detailKey]),
      `en rows.${detailKey} present (hasDetail) + non-empty`,
    );
    assert(
      isNonEmptyString(zh[detailKey]),
      `zh rows.${detailKey} present (hasDetail) + non-empty`,
    );
  } else {
    assert(
      !(detailKey in en) && !(detailKey in zh),
      `no rows.${detailKey} key (row is not hasDetail)`,
    );
  }
}

// ── AC3③ — no orphan keys; en/zh symmetric ─────────────────────────────────
console.log("compare · AC3③ no orphan keys / en==zh shape");
const expectedKeys = new Set<string>();
for (const row of COMPARE_ROWS) {
  expectedKeys.add(row.id);
  if (row.hasDetail === true) expectedKeys.add(`${row.id}Detail`);
}
for (const [locale, bundle] of [
  ["en", en],
  ["zh", zh],
] as const) {
  const orphans = Object.keys(bundle).filter((k) => !expectedKeys.has(k));
  assert(
    orphans.length === 0,
    `${locale}: no orphan rows.* keys${orphans.length ? ` (found: ${orphans.join(", ")})` : ""}`,
  );
}
const enKeys = Object.keys(en).sort();
const zhKeys = Object.keys(zh).sort();
assert(
  JSON.stringify(enKeys) === JSON.stringify(zhKeys),
  "en and zh rows.* key sets are identical",
);

// ── AC3⑥ — cost row floor not contradicted by the pricing snapshot ──────────
// The `cost` row states a SaaS lower bound (e.g. "~$2k+/mo") for the standard
// 100 GB/day workload the /why#cost calculator models. We don't re-price here
// (T03 owns PRICING_SNAPSHOT); we only fail if that floor drifts ABOVE what the
// snapshot model actually produces — i.e. the data source would contradict the
// calculator on the same page. Parse the smallest dollar figure in the value
// ("$2k" → 2000, "$2000" → 2000) and assert the modeled bill clears it.
console.log("compare · AC3⑥ cost floor vs PRICING_SNAPSHOT");
assert(
  /^\d{4}-\d{2}-\d{2}$/.test(PRICING_SNAPSHOT),
  `PRICING_SNAPSHOT "${PRICING_SNAPSHOT}" is an ISO date`,
);
const costRow = COMPARE_ROWS.find((r) => r.id === "cost");
assert(!!costRow, "a `cost` row exists in COMPARE_ROWS");
if (costRow) {
  const m = costRow.saas.value.match(/\$\s*([\d.]+)\s*(k|m)?/i);
  assert(!!m, `cost.saas.value "${costRow.saas.value}" contains a $ figure`);
  if (m) {
    const mult = m[2]?.toLowerCase() === "k" ? 1_000 : m[2]?.toLowerCase() === "m" ? 1_000_000 : 1;
    const statedFloor = parseFloat(m[1]) * mult;
    // Standard workload the calculator models; retention at the indexed baseline.
    const modeled = calculateCost({ gbPerDay: 100, retentionDays: 15 }).datadogMonthly;
    assert(
      modeled >= statedFloor,
      `modeled Datadog $${modeled}/mo (100GB/day) clears the stated floor $${statedFloor}/mo — snapshot not contradicted`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("\nAll compare-data contract checks passed.");
