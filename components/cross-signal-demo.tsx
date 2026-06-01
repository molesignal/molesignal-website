"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Pill } from "@/components/ui/pill";
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
      className={cn(
        "border-border bg-surface shadow-hero-card relative overflow-hidden rounded-2xl border p-6 md:p-8",
        className,
      )}
    >
      {/* Header chrome */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Pill variant="marketing">{t("pill")}</Pill>
          <h3 className="text-fg text-display-md font-display tracking-tight">
            {t("heading")}
          </h3>
        </div>
        <div
          role="tablist"
          aria-label={t("tabAria")}
          className="border-border bg-bg-2 inline-flex rounded-md border p-1"
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
                  "duration-fast inline-flex h-7 items-center rounded-[4px] px-3 text-xs font-strong transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-fg-muted hover:bg-bg-hover hover:text-fg",
                )}
              >
                {t(`tabs.${key}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage */}
      <div
        className="bg-bg-2 border-border mt-6 overflow-hidden rounded-lg border"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={
              reduceMotion ? undefined : { opacity: 0, y: 6 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="p-4"
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
      <p className="text-fg-muted mt-4 text-xs">
        {t("footerPrefix")}{" "}
        <code className="font-mono">trace_id={TRACE_ID}</code>{" "}
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
  const points = [22, 24, 28, 35, 47, 62, 84, 98, 96, 71, 48, 34, 28];
  const w = 380;
  const h = 90;
  const max = 100;
  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${
          (i * w) / (points.length - 1)
        },${h - (p / max) * h}`,
    )
    .join(" ");
  const incidentX = (7 * w) / (points.length - 1);

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
      <svg
        viewBox={`0 0 ${w} ${h + 14}`}
        className="w-full"
        aria-label="DB pool saturation timeseries"
      >
        <line
          x1={0}
          x2={w}
          y1={h * 0.2}
          y2={h * 0.2}
          stroke="var(--bd-1)"
          strokeDasharray="4 4"
          strokeWidth="0.8"
        />
        <path d={path} stroke="var(--indigo)" strokeWidth="2" fill="none" />
        <circle cx={incidentX} cy={h - (98 / max) * h} r="4" fill="var(--marketing-accent)" />
        <text
          x={incidentX + 8}
          y={h - (98 / max) * h + 4}
          fontSize="10"
          fill="var(--marketing-accent)"
          fontWeight="700"
        >
          {incidentLabel}
        </text>
        <text x={0} y={h + 12} fontSize="10" fill="var(--fg-muted)">12:00</text>
        <text x={w - 30} y={h + 12} fontSize="10" fill="var(--fg-muted)">12:12</text>
      </svg>
    </div>
  );
}
