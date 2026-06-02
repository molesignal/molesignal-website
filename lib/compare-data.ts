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
 *
 * ── How to safely update a row (no component change needed) ─────────────────
 * The CompareTable component (components/compare-table.tsx) is a pure renderer
 * over COMPARE_ROWS — you change data here, never the component. To add, edit,
 * remove, or reorder a row:
 *   1. Edit COMPARE_ROWS below. For a NEW row give it a unique `id` (a simple
 *      identifier, e.g. `myDimension`), the three cells (saas/oss/molesignal)
 *      each with a `value` (English factual string) + `verdict`
 *      (good | mixed | bad | neutral), and `hasDetail: true` ONLY if you also
 *      add a one-line detail/tooltip.
 *   2. Add the matching i18n keys in BOTH messages/en.json and messages/zh.json
 *      under `components.compareTable.rows`:
 *        - `<id>`        — the dimension label (required, both locales)
 *        - `<id>Detail`  — the detail line (required IFF `hasDetail: true`)
 *      Removing a row? Delete its `<id>` (and `<id>Detail`) keys from both files
 *      so no orphan keys linger.
 *   3. Run `pnpm test:compare` — it asserts the data↔i18n↔type contract
 *      (label keys present in en+zh, Detail keys iff hasDetail, no orphan keys,
 *      legal verdicts, unique ids, cost floor sane). Then `pnpm lint:i18n`.
 *
 * ── Ordering matters for Home ──────────────────────────────────────────────
 * The slim table on Home renders the FIRST 4 rows (COMPARE_ROWS.slice(0, 4));
 * /why renders all of them. Reordering rows here therefore changes which four
 * dimensions surface on the homepage — keep the four highest-impact rows on top.
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
    // SaaS cost is a conservative ~$2k+/mo floor for a 100 GB/day workload with
    // typical partial indexing; the /why#cost calculator models the all-indexed
    // upper bound. Both trace to lib/cost-formula PRICING_SNAPSHOT (Datadog
    // public list pricing). Keep this a defensible lower bound, not a max.
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
