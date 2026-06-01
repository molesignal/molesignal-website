import { ArrowRight, Check, Minus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import {
  COMPARE_ROWS,
  type CompareCell,
  type CompareRow,
} from "@/lib/compare-data";
import { cn } from "@/lib/utils";

type Variant = "slim" | "full";

/**
 * Comparison table — molesignal vs Datadog vs OSS stack.
 *
 * - `variant="slim"`: first 4 rows + "See full comparison →" CTA, used on Home
 * - `variant="full"`: all rows, used on /why
 *
 * Desktop: native horizontal table with sticky first column.
 * Mobile (<768px): each row collapses into a stacked card. We render twice
 * (desktop hidden on mobile, mobile hidden on desktop) — cheaper than
 * JS-driven layout and accessible to screen readers either way.
 *
 * Dimensions/details/column-headers are localized via
 * `components.compareTable.*`. Cell values stay English (factual short
 * comparisons that read the same in any locale).
 */
export function CompareTable({
  variant = "full",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const t = useTranslations("components.compareTable");
  const tCommon = useTranslations("common");
  const rows = variant === "slim" ? COMPARE_ROWS.slice(0, 4) : COMPARE_ROWS;

  const colSaas = { name: t("saasName"), sub: t("saasSub") };
  const colOss = { name: t("ossName"), sub: t("ossSub") };
  const colMole = { name: t("moleName"), sub: t("moleSub") };

  const labelFor = (row: CompareRow) => t(`rows.${row.id}`);
  const detailFor = (row: CompareRow): string | undefined =>
    row.hasDetail ? t(`rows.${row.id}Detail`) : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop: real table */}
      <div className="border-border bg-surface hidden overflow-hidden rounded-lg border md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-border border-b">
                <th
                  scope="col"
                  className="bg-surface text-fg-muted sticky left-0 z-10 px-4 py-3 text-left text-xs font-strong uppercase tracking-wide"
                >
                  {t("dimension")}
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <ColumnHeader name={colSaas.name} sub={colSaas.sub} />
                </th>
                <th scope="col" className="px-4 py-3 text-left">
                  <ColumnHeader name={colOss.name} sub={colOss.sub} />
                </th>
                <th
                  scope="col"
                  className="bg-primary-bg px-4 py-3 text-left ring-1 ring-primary-muted/30 ring-inset"
                >
                  <ColumnHeader
                    name={colMole.name}
                    sub={colMole.sub}
                    highlight
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-border",
                    i < rows.length - 1 && "border-b",
                  )}
                >
                  <th
                    scope="row"
                    className="bg-surface sticky left-0 z-10 px-4 py-3 text-left align-top"
                  >
                    <div className="text-fg font-strong">{labelFor(row)}</div>
                    {detailFor(row) && (
                      <p className="text-fg-muted mt-0.5 text-xs font-body max-w-xs">
                        {detailFor(row)}
                      </p>
                    )}
                  </th>
                  <Cell cell={row.saas} />
                  <Cell cell={row.oss} />
                  <Cell cell={row.molesignal} highlight />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <MobileCard
            key={row.id}
            row={row}
            label={labelFor(row)}
            detail={detailFor(row)}
            colNames={{
              saas: colSaas.name,
              oss: colOss.name,
              mole: colMole.name,
            }}
          />
        ))}
      </div>

      {variant === "slim" && (
        <div className="flex justify-end">
          <Link
            href="/why#compare"
            data-analytics-event="compare_table_expand"
            data-analytics-source-page
            className="text-primary hover:text-marketing-accent duration-fast inline-flex items-center gap-1 text-sm font-strong transition-colors"
          >
            {tCommon("seeFullComparison")}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}

function ColumnHeader({
  name,
  sub,
  highlight = false,
}: {
  name: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "text-sm font-strong",
          highlight ? "text-primary" : "text-fg",
        )}
      >
        {name}
      </div>
      <div className="text-fg-muted mt-0.5 text-xs font-body">{sub}</div>
    </div>
  );
}

function Cell({
  cell,
  highlight = false,
}: {
  cell: CompareCell;
  highlight?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-top text-sm",
        highlight && "bg-primary-bg/40",
      )}
    >
      <div className="flex items-start gap-2">
        <VerdictIcon verdict={cell.verdict} />
        <span className="text-fg">{cell.value}</span>
      </div>
    </td>
  );
}

function VerdictIcon({ verdict }: { verdict: CompareCell["verdict"] }) {
  const cls = "mt-0.5 shrink-0";
  switch (verdict) {
    case "good":
      return <Check size={14} className={cn(cls, "text-green")} aria-hidden />;
    case "bad":
      return <X size={14} className={cn(cls, "text-red")} aria-hidden />;
    case "mixed":
      return (
        <Minus size={14} className={cn(cls, "text-fg-muted")} aria-hidden />
      );
    default:
      return null;
  }
}

function MobileCard({
  row,
  label,
  detail,
  colNames,
}: {
  row: CompareRow;
  label: string;
  detail?: string;
  colNames: { saas: string; oss: string; mole: string };
}) {
  return (
    <div className="border-border bg-surface space-y-3 rounded-lg border p-4">
      <div>
        <div className="text-fg font-strong">{label}</div>
        {detail && <p className="text-fg-muted mt-0.5 text-xs">{detail}</p>}
      </div>
      <dl className="text-sm grid grid-cols-1 gap-2">
        <MobileRow label={colNames.saas} cell={row.saas} />
        <MobileRow label={colNames.oss} cell={row.oss} />
        <MobileRow label={colNames.mole} cell={row.molesignal} highlight />
      </dl>
    </div>
  );
}

function MobileRow({
  label,
  cell,
  highlight = false,
}: {
  label: string;
  cell: CompareCell;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-md px-2 py-1.5",
        highlight && "bg-primary-bg",
      )}
    >
      <dt
        className={cn(
          "text-xs font-strong",
          highlight ? "text-primary" : "text-fg-muted",
        )}
      >
        {label}
      </dt>
      <dd className="text-fg flex items-start gap-1.5 text-right">
        <VerdictIcon verdict={cell.verdict} />
        <span>{cell.value}</span>
      </dd>
    </div>
  );
}
