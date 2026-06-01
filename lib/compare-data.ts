/**
 * Source of truth for the comparison table on Home (slim) and /why (full).
 *
 * Schema split:
 *   - row `id` selects an i18n key under `components.compareTable.rows.*`
 *     for the dimension label and (optionally) detail. The CompareTable
 *     component performs the lookup so EN/ZH stay in sync via messages.
 *   - cell `value` strings stay English — they're factual comparisons
 *     (prices, technical capabilities, command names) that read the same
 *     in any locale and benefit from being byte-identical with README.
 *
 * Updates to row data must also update the same key in both
 * messages/en.json and messages/zh.json (verified by pnpm lint:i18n).
 */

export type CompareRow = {
  /** Stable ID used for i18n key lookup and React keys. */
  id: string;
  /** Whether this row also has a detail / tooltip translation. */
  hasDetail?: boolean;
  saas: CompareCell;
  oss: CompareCell;
  molesignal: CompareCell;
};

export type CompareCell = {
  /** Display value — short. */
  value: string;
  /** Verdict drives the badge color: good / mixed / bad / neutral. */
  verdict: "good" | "mixed" | "bad" | "neutral";
};

export const COMPARE_ROWS: CompareRow[] = [
  {
    id: "cost",
    saas: { value: "~$2k+/mo · grows linearly", verdict: "bad" },
    oss: { value: "infra only", verdict: "good" },
    molesignal: { value: "infra only", verdict: "good" },
  },
  {
    id: "sameStorage",
    hasDetail: true,
    saas: { value: "✓ (their cloud)", verdict: "mixed" },
    oss: { value: "3 stores, 3 query langs", verdict: "bad" },
    molesignal: { value: "Parquet + DataFusion", verdict: "good" },
  },
  {
    id: "correlation",
    hasDetail: true,
    saas: { value: "✓ (paid)", verdict: "mixed" },
    oss: { value: "manual trace_id copy-paste", verdict: "bad" },
    molesignal: { value: "native (/web/correlation/*)", verdict: "good" },
  },
  {
    id: "ownership",
    saas: { value: "their cloud", verdict: "bad" },
    oss: { value: "self-hosted", verdict: "good" },
    molesignal: { value: "self-hosted", verdict: "good" },
  },
  {
    id: "setup",
    saas: { value: "5 min (agents)", verdict: "good" },
    oss: { value: "6 hours+ (5 components + Grafana)", verdict: "bad" },
    molesignal: { value: "1 cmd `docker compose up`", verdict: "good" },
  },
  {
    id: "otelNative",
    saas: { value: "yes", verdict: "good" },
    oss: { value: "partial", verdict: "mixed" },
    molesignal: { value: "yes (10 ingest protocols)", verdict: "good" },
  },
  {
    id: "realtime",
    saas: { value: "yes", verdict: "good" },
    oss: { value: "no (eval ≥ scrape interval)", verdict: "bad" },
    molesignal: { value: "yes (kind: realtime)", verdict: "good" },
  },
  {
    id: "multiTenant",
    saas: { value: "yes (per-account)", verdict: "good" },
    oss: { value: "no", verdict: "bad" },
    molesignal: { value: "yes (planner-level org rewrite)", verdict: "good" },
  },
];
