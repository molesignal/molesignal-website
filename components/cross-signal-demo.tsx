"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type TabKey = "trace" | "logs" | "metric";

const TAB_KEYS: TabKey[] = ["trace", "logs", "metric"];

const TRACE_ID = "abc123";
const AUTO_INTERVAL_MS = 2600;

/**
 * Hero-secondary interactive demo. Three tabs (Trace / Logs / Metric); a
 * single `trace_id` is highlighted in all three views.
 *
 * Auto-plays a tour through the three tabs on mount (2 full cycles), then
 * stops on the last tab. User interaction (click / keyboard) cancels the
 * auto-tour. `prefers-reduced-motion` skips the auto-tour entirely.
 *
 * ── T23 data-source decision (ISSUE-24, 2026-06-02) ──────────────────────
 * The sample below is an INTENTIONAL hardcoded illustration, not live data.
 * There is no real/sandbox query backend to wire to: the molesignal query
 * engine is a separate cross-project product, and this is the marketing
 * site's "five-second demo" (see the honest `pill` copy). Connecting a real
 * backend is a cross-project call that needs an explicit user/product
 * decision; the task default — kept here — is to stay with the hardcoded
 * sample. Should a sandbox query endpoint land later, swap the three
 * View fixtures for a fetch without touching the tab/auto-tour shell.
 * The `prefers-reduced-motion` guard below MUST be preserved across any
 * such change (locked by tests/e2e/issue24-t23-cross-signal-demo.spec.ts).
 */
export function CrossSignalDemo({ className }: { className?: string }) {
  const t = useTranslations("components.crossSignalDemo");
  const [active, setActive] = useState<TabKey>("trace");
  const [interacted, setInteracted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (interacted || reduceMotion) return;
    let cycles = 0;
    const id = window.setInterval(() => {
      setActive((cur) => {
        const idx = TAB_KEYS.indexOf(cur);
        const next = TAB_KEYS[(idx + 1) % TAB_KEYS.length];
        if ((idx + 1) % TAB_KEYS.length === 0) cycles += 1;
        if (cycles >= 2) {
          window.clearInterval(id);
        }
        return next;
      });
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [interacted, reduceMotion]);

  const pick = (key: TabKey) => {
    // Only fire on a real tab change — re-clicking the active tab is a no-op
    // for analytics. The auto-tour mutates `active` via setActive directly
    // (not through pick), so the tour never emits this event.
    if (key !== active) {
      track("demo_tab_switch", { tab: key });
    }
    setActive(key);
    setInteracted(true);
  };

  return (
    <div
      data-testid="cross-signal-demo"
      className={cn(
        "border-border bg-surface shadow-hero-card relative overflow-hidden rounded-2xl border",
        className,
      )}
    >
      {/* Terminal chrome — three-dot header + attached tab bar */}
      <div className="border-border bg-bg-2 flex items-center gap-2 border-b px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="bg-red/70 h-3 w-3 rounded-full" />
          <span className="bg-marketing-accent/70 h-3 w-3 rounded-full" />
          <span className="bg-green/70 h-3 w-3 rounded-full" />
        </span>
        <span className="text-fg-muted ml-2 truncate font-mono text-xs">
          {t("heading")}
        </span>
      </div>
      <div
        role="tablist"
        aria-label={t("tabAria")}
        className="border-border bg-bg-2 flex border-b"
      >
        {TAB_KEYS.map((key) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => pick(key)}
              className={cn(
                "duration-fast relative inline-flex h-9 items-center px-4 text-xs font-strong transition-colors",
                isActive ? "text-fg" : "text-fg-muted hover:text-fg",
              )}
            >
              {t(`tabs.${key}`)}
              {/* Active underline — unified 3px brand active rule */}
              {isActive && (
                <span
                  aria-hidden
                  className="bg-primary absolute inset-x-0 bottom-0 h-[3px]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <div className="bg-bg-2 min-h-[180px]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={
              reduceMotion ? undefined : { opacity: 0, y: 6 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="p-4 md:p-6"
          >
            {active === "trace" && <TraceView />}
            {active === "logs" && <LogsView />}
            {active === "metric" && (
              <MetricView incidentLabel={t("incident")} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer caption */}
      <p className="text-fg-muted border-border bg-surface border-t px-4 py-3 text-xs">
        {t("footerPrefix")}{" "}
        <code className="bg-marketing-accent-dim text-marketing-accent rounded px-1 font-mono">
          trace_id={TRACE_ID}
        </code>{" "}
        {t("footerSuffix")}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Trace waterfall — 4 spans, the root highlighted with the trace_id
// ─────────────────────────────────────────────────────────────────────────
function TraceView() {
  const spans = [
    { name: "POST /api/checkout", offset: 0, width: 100, color: "indigo", root: true },
    { name: "db.tx.begin", offset: 12, width: 18, color: "blue" },
    { name: "stripe.charge", offset: 32, width: 42, color: "marketing-accent" },
    { name: "db.tx.commit", offset: 78, width: 16, color: "blue" },
  ];

  return (
    <div className="space-y-1.5">
      <div className="mb-2 flex items-center gap-2 text-[11px]">
        <span className="text-fg-muted">trace_id</span>
        <code className="bg-marketing-accent-dim text-marketing-accent rounded px-1.5 py-0.5 font-mono font-strong">
          {TRACE_ID}
        </code>
        <span className="text-fg-muted">· 4 spans · 280ms</span>
      </div>
      {spans.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className={cn(
              "w-40 truncate text-[11px]",
              s.root ? "text-fg font-strong" : "text-fg-muted",
            )}
          >
            {s.name}
          </div>
          <div className="bg-bg-3 relative h-3 flex-1 overflow-hidden rounded">
            <div
              className={cn(
                "absolute h-full rounded",
                s.color === "indigo" && "bg-indigo",
                s.color === "blue" && "bg-blue",
                s.color === "marketing-accent" &&
                  "bg-marketing-accent",
              )}
              style={{ left: `${s.offset}%`, width: `${s.width}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Log rows — the matching trace_id is highlighted on every row
// ─────────────────────────────────────────────────────────────────────────
function LogsView() {
  const rows = [
    { ts: "12:04:01.022", level: "INFO", msg: "checkout request received", tone: "blue" },
    { ts: "12:04:01.058", level: "INFO", msg: "stripe.charge attempted", tone: "blue" },
    { ts: "12:04:01.300", level: "ERROR", msg: "db pool exhausted; tx rolled back", tone: "red" },
    { ts: "12:04:01.301", level: "WARN", msg: "retrying with backoff (1/3)", tone: "yellow" },
  ];
  return (
    <div className="space-y-1 font-mono text-[11px]">
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-2 leading-relaxed"
        >
          <span className="text-fg-muted tabular-nums">{r.ts}</span>
          <span
            className={cn(
              "w-12 shrink-0 font-strong",
              r.tone === "blue" && "text-blue",
              r.tone === "red" && "text-red",
              r.tone === "yellow" && "text-marketing-accent",
            )}
          >
            {r.level}
          </span>
          <span className="text-fg flex-1 truncate">{r.msg}</span>
          <code className="bg-marketing-accent-dim text-marketing-accent rounded px-1.5 py-0.5 text-[10px] font-strong">
            {TRACE_ID}
          </code>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Metric sparkline — DB pool saturation with the incident annotated
// ─────────────────────────────────────────────────────────────────────────
function MetricView({ incidentLabel }: { incidentLabel: string }) {
  // Per-minute saturation samples, 12:00–12:12. Hand-tuned (NOT Math.random,
  // which would break SSR hydration) to read like a real noisy metric: a jagged
  // climb that crosses the 80% threshold and tops out at the 12:04 incident,
  // then a noisy decay.
  const series = [
    { t: "12:00", v: 18 },
    { t: "12:01", v: 26 },
    { t: "12:02", v: 22 },
    { t: "12:03", v: 41 },
    { t: "12:04", v: 96 },
    { t: "12:05", v: 83 },
    { t: "12:06", v: 71 },
    { t: "12:07", v: 77 },
    { t: "12:08", v: 62 },
    { t: "12:09", v: 54 },
    { t: "12:10", v: 58 },
    { t: "12:11", v: 43 },
    { t: "12:12", v: 38 },
  ];
  const THRESHOLD = 80;
  const incidentIdx = 4; // 12:04
  const n = series.length;
  // Fixed plot height in px so the Y-axis labels and grid lines line up.
  const PLOT_H = 150;
  const TOP_PAD = 20; // px band above the plot for the incident annotation
  // Graphics live in a 120×100 viewBox (x = minute·10, y = 100 − sat%) and are
  // stretched to fill the plot box (preserveAspectRatio="none"); every stroke
  // uses non-scaling-stroke and all text is a fixed-px overlay, so nothing
  // scales with the card width. value→% is identity (viewBox y is 0–100).
  const xVB = (i: number) => (i * 120) / (n - 1);
  const yVB = (v: number) => 100 - v;
  const linePath = series
    .map((s, i) => `${i === 0 ? "M" : "L"} ${xVB(i).toFixed(1)},${yVB(s.v).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L 120,100 L 0,100 Z`;
  const yTicks = [100, 75, 50, 25, 0];
  const xTicks = series.filter((_, i) => i % 2 === 0);
  const incidentLeftPct = (incidentIdx / (n - 1)) * 100;
  const incidentTopPct = yVB(series[incidentIdx].v);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px]">
        <span className="text-fg-muted">host_pool_saturation</span>
        <span className="text-fg-muted">· host-prod-7</span>
        <span className="text-fg-muted">· 1m</span>
        <code className="bg-marketing-accent-dim text-marketing-accent ml-auto rounded px-1.5 py-0.5 font-mono font-strong">
          {TRACE_ID}
        </code>
      </div>
      {/* Grafana-style chart: Y ticks in the left gutter, a full-bleed plot box
          (grid + area + threshold + curve as SVG), X ticks underneath. Every
          stroke uses non-scaling-stroke and all text + the marker dot are
          fixed-px overlays, so nothing scales with the card width. */}
      <div className="relative w-full pl-9" style={{ paddingTop: `${TOP_PAD}px` }}>
        {/* Y-axis tick labels */}
        {yTicks.map((v) => (
          <span
            key={v}
            className="text-fg-muted absolute left-0 -translate-y-1/2 text-[10px] tabular-nums"
            style={{ top: `${TOP_PAD + ((100 - v) / 100) * PLOT_H}px` }}
          >
            {v}%
          </span>
        ))}

        {/* Plot box */}
        <div className="relative w-full" style={{ height: `${PLOT_H}px` }}>
          <svg
            className="absolute inset-0 block h-full w-full overflow-visible"
            viewBox="0 0 120 100"
            preserveAspectRatio="none"
            aria-label="DB pool saturation timeseries"
          >
            <defs>
              <linearGradient id="msig-area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--indigo)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--indigo)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {yTicks.map((v) => (
              <line
                key={v}
                x1="0"
                x2="120"
                y1={yVB(v)}
                y2={yVB(v)}
                stroke="var(--bd-1)"
                strokeWidth="1"
                opacity="0.45"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <path d={areaPath} fill="url(#msig-area-fill)" />
            <line
              x1="0"
              x2="120"
              y1={yVB(THRESHOLD)}
              y2={yVB(THRESHOLD)}
              stroke="var(--red)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.6"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={linePath}
              fill="none"
              stroke="var(--indigo)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* threshold label at the right end of the threshold line */}
          <span
            className="text-red/80 bg-bg-2 absolute right-1 -translate-y-1/2 rounded px-1 text-[10px] font-strong"
            style={{ top: `${((100 - THRESHOLD) / 100) * PLOT_H}px` }}
          >
            threshold {THRESHOLD}%
          </span>

          {/* incident marker dot — exactly on the 12:04 data point */}
          <span
            aria-hidden
            className="bg-marketing-accent ring-bg-2 absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
            style={{ left: `${incidentLeftPct}%`, top: `${incidentTopPct}%` }}
          />
          {/* incident annotation, above-right of the dot */}
          <span
            className="text-marketing-accent font-strong absolute -translate-y-full whitespace-nowrap text-[13px]"
            style={{
              left: `${incidentLeftPct}%`,
              top: `${incidentTopPct}%`,
              marginLeft: "0.5rem",
              marginTop: "-0.3rem",
            }}
          >
            {incidentLabel}
          </span>
        </div>

        {/* X-axis tick labels */}
        <div className="relative mt-1.5 h-3 w-full">
          {xTicks.map((s, i) => (
            <span
              key={s.t}
              className="text-fg-muted absolute -translate-x-1/2 text-[10px] tabular-nums"
              style={{ left: `${(i / (xTicks.length - 1)) * 100}%` }}
            >
              {s.t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
