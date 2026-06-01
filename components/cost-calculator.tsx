"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { calculateCost, formatUsd } from "@/lib/cost-formula";
import { cn } from "@/lib/utils";

const DEFAULT_GB = 100;
const DEFAULT_RETENTION = 30;

/**
 * Interactive cost comparison: Datadog (estimated, public pricing) vs
 * molesignal infra (S3 + small compute). Controls are sliders on desktop
 * and number inputs on mobile (sliders are imprecise on touch).
 *
 * Numbers come from `lib/cost-formula.ts`. Disclaimer renders below so the
 * "Proof over promise" principle is preserved — we tell users where the
 * numbers come from and when they may diverge.
 */
export function CostCalculator({ className }: { className?: string }) {
  const t = useTranslations("components.costCalculator");
  const locale = useLocale();
  const [gbPerDay, setGb] = useState(DEFAULT_GB);
  const [retention, setRetention] = useState(DEFAULT_RETENTION);

  const result = useMemo(
    () => calculateCost({ gbPerDay, retentionDays: retention }),
    [gbPerDay, retention],
  );

  const now = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <div
      className={cn(
        "border-border bg-surface space-y-6 rounded-xl border p-6",
        className,
      )}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <SliderField
          label={t("ingest")}
          value={gbPerDay}
          min={10}
          max={1000}
          step={10}
          unit={t("ingestUnit")}
          onChange={setGb}
        />
        <SliderField
          label={t("retention")}
          value={retention}
          min={7}
          max={90}
          step={1}
          unit={t("retentionUnit")}
          onChange={setRetention}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card
          tone="bad"
          label={t("datadogCard")}
          value={formatUsd(result.datadogMonthly)}
          sub={t("datadogSub")}
        />
        <Card
          tone="good"
          label={t("moleCard")}
          value={formatUsd(result.molesignalMonthly)}
          sub={t("moleSub")}
        />
        <Card
          tone="brand"
          label={t("savingsCard")}
          value={
            result.savingsMonthly > 0 ? formatUsd(result.savingsMonthly) : "—"
          }
          sub={
            result.savingsPercent > 0
              ? t("savingsLess", { percent: result.savingsPercent })
              : t("savingsDepends")
          }
        />
      </div>

      <p className="text-fg-muted text-xs leading-relaxed">
        {t("disclaimerPrefix")} {now}
        {t("disclaimerBody")}
      </p>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  const id = `cost-${label.toLowerCase()}`;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-fg text-sm font-strong">
          {label}
        </label>
        <output
          htmlFor={id}
          className="text-fg font-mono text-base font-display-strong"
        >
          {value.toLocaleString("en-US")}{" "}
          <span className="text-fg-muted text-xs font-body">{unit}</span>
        </output>
      </div>
      {/* Desktop slider */}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="accent-primary block w-full"
      />
      {/* Mobile number input alternative for fine control */}
      <input
        aria-label={`${label} number value`}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="border-border bg-bg-0 text-fg focus-visible:border-primary mt-1 block h-8 w-full rounded-md border px-2 text-sm outline-none md:hidden"
      />
    </div>
  );
}

function Card({
  tone,
  label,
  value,
  sub,
}: {
  tone: "good" | "bad" | "brand";
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        tone === "good" && "border-green/40 bg-green-dim",
        tone === "bad" && "border-red/40 bg-red-dim",
        tone === "brand" && "border-primary-muted bg-primary-bg",
      )}
    >
      <div
        className={cn(
          "text-xs font-strong uppercase tracking-wide",
          tone === "good" && "text-green",
          tone === "bad" && "text-red",
          tone === "brand" && "text-primary",
        )}
      >
        {label}
      </div>
      <div className="text-fg font-display-strong mt-1 text-display-lg font-mono">
        {value}
      </div>
      <div className="text-fg-muted mt-0.5 text-xs">{sub}</div>
    </div>
  );
}
