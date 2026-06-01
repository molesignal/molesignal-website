/**
 * Cost modeling for the CostCalculator widget on /why#cost.
 *
 * Disclaimer baked into the UI: these are rough order-of-magnitude estimates
 * intended to make the gap between SaaS pricing and self-hosted infra costs
 * tangible. Real bills depend on retention, redundancy, region, and
 * negotiated discounts.
 *
 * Datadog per-unit figures are public list prices (annual billing), verified
 * against https://www.datadoghq.com/pricing/ on the snapshot date below:
 *   - Log Management ingest: $0.10 / ingested GB
 *   - Log Management indexing (Standard, 15-day retention): $1.70 / M events
 *   - APM indexed spans (Standard, 15-day retention): $1.70 / M spans
 *   - Infrastructure Pro: $15 / host / month (referenced for compute framing)
 * We pick representative bundles, assume ingested logs are indexed (an upper
 * bound — most orgs index a subset), and round to the nearest $50/mo to avoid
 * false precision. Update PRICING_SNAPSHOT whenever these rates are re-checked.
 */

/** Date the Datadog list prices above were last verified (ISO, UTC). */
export const PRICING_SNAPSHOT = "2026-06-02";
/** Public source the snapshot was verified against. */
export const PRICING_SOURCE_URL = "https://www.datadoghq.com/pricing/";

const DD_LOGS_INGEST_PER_GB = 0.1; // USD per GB ingested
const DD_LOGS_INDEXED_PER_M = 1.7; // USD per million events, Standard 15-day indexing
const DD_AVG_EVENTS_PER_GB = 1_000_000; // rough heuristic — 1KB events
const DD_TRACES_PER_M = 1.7; // USD per million indexed spans, Standard 15-day
const DD_INDEXED_RETENTION_DAYS = 15; // retention already priced into the rates above
const DD_RETENTION_MULTIPLIER_PER_30D = 1.5; // each +30d beyond baseline adds 50%

const MOLE_S3_PER_GB_MONTH = 0.023; // S3 Standard ~$0.023/GB-month
const MOLE_COMPUTE_BASELINE = 80; // small Postgres + 2 modest compute boxes
const MOLE_COMPUTE_PER_100GB_DAY = 25; // additional compute cost per 100GB ingest

export type CostInput = {
  /** Ingest volume per day, GB. */
  gbPerDay: number;
  /** Retention, days. */
  retentionDays: number;
};

export type CostResult = {
  datadogMonthly: number;
  molesignalMonthly: number;
  savingsMonthly: number;
  savingsPercent: number;
};

function clamp(n: number, lo: number, hi: number) {
  // Mobile <input type="number"> can yield NaN on partial/cleared entry;
  // coerce non-finite input to the lower bound so results never go NaN.
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function round50(n: number) {
  return Math.round(n / 50) * 50;
}

export function calculateCost({
  gbPerDay,
  retentionDays,
}: CostInput): CostResult {
  const gb = clamp(gbPerDay, 1, 5000);
  const ret = clamp(retentionDays, 1, 365);

  const gbPerMonth = gb * 30;
  const ddIngest = gbPerMonth * DD_LOGS_INGEST_PER_GB;
  const ddIndexed =
    (gbPerMonth * DD_AVG_EVENTS_PER_GB * DD_LOGS_INDEXED_PER_M) / 1_000_000;
  const ddTraces =
    (gbPerMonth * DD_AVG_EVENTS_PER_GB * 0.1 * DD_TRACES_PER_M) / 1_000_000;
  // The indexed rates already cover DD_INDEXED_RETENTION_DAYS; only retention
  // beyond that baseline scales the bill (clamped to ≥1 below).
  const ddRetentionMult =
    1 +
    ((ret - DD_INDEXED_RETENTION_DAYS) / 30) *
      (DD_RETENTION_MULTIPLIER_PER_30D - 1);
  const datadog =
    (ddIngest + ddIndexed + ddTraces) * Math.max(1, ddRetentionMult);

  const moleStorage = gbPerMonth * (ret / 30) * MOLE_S3_PER_GB_MONTH;
  const moleCompute =
    MOLE_COMPUTE_BASELINE + (gb / 100) * MOLE_COMPUTE_PER_100GB_DAY;
  const molesignal = moleStorage + moleCompute;

  const savingsMonthly = datadog - molesignal;
  const savingsPercent =
    datadog > 0 ? Math.round((savingsMonthly / datadog) * 100) : 0;

  return {
    datadogMonthly: round50(datadog),
    molesignalMonthly: round50(molesignal),
    savingsMonthly: round50(savingsMonthly),
    savingsPercent: Math.max(0, savingsPercent),
  };
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString("en-US")}`;
}
