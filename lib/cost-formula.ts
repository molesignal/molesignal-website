/**
 * Cost modeling for the CostCalculator widget on /why#cost.
 *
 * Disclaimer baked into the UI: these are rough order-of-magnitude estimates
 * intended to make the gap between SaaS pricing and self-hosted infra costs
 * tangible. Real bills depend on retention, redundancy, region, and
 * negotiated discounts.
 *
 * Numbers reference public Datadog pricing pages (Logs $0.10/GB ingest +
 * $1.27/M for 7d indexed; APM Spans $1.00/M; Infra $15/host/mo). We pick
 * representative bundles and round to nearest $50/mo to avoid false precision.
 */

const DD_LOGS_INGEST_PER_GB = 0.1; // USD per GB ingested
const DD_LOGS_INDEXED_PER_M = 1.27; // USD per million events for 7d indexing
const DD_AVG_EVENTS_PER_GB = 1_000_000; // rough heuristic — 1KB events
const DD_TRACES_PER_M = 1.0; // USD per million spans
const DD_RETENTION_MULTIPLIER_PER_30D = 1.5; // each +30d retention adds 50%

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
  const ddTraces = (gbPerMonth * DD_AVG_EVENTS_PER_GB * 0.1 * DD_TRACES_PER_M) / 1_000_000;
  const ddRetentionMult = 1 + ((ret - 7) / 30) * (DD_RETENTION_MULTIPLIER_PER_30D - 1);
  const datadog = (ddIngest + ddIndexed + ddTraces) * Math.max(1, ddRetentionMult);

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
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString("en-US")}`;
}
