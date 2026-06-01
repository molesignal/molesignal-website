"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import roadmap from "@/content/roadmap.json";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

type Phase = "now" | "next" | "later" | "done";

type Milestone = {
  id: string;
  phase: string;
  title: string;
  summary: string;
  estimate: string;
  issueUrl: string | null;
};

const PHASE_KEYS: Phase[] = ["now", "next", "later", "done"];

const PILL_VARIANT: Record<Phase, "brand" | "marketing" | "default" | "success"> = {
  now: "brand",
  next: "marketing",
  later: "default",
  done: "success",
};

const ALL: Milestone[] = roadmap as Milestone[];

/**
 * Roadmap with 4-phase tabs. Hash-anchored — opening /roadmap#next jumps
 * directly to the "Next" tab. Each milestone links to its GitHub issue if
 * one exists.
 */
export function RoadmapList({ className }: { className?: string }) {
  const t = useTranslations("roadmap");
  const [active, setActive] = useState<Phase>("now");

  // Hash sync: read on mount, write on change
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (PHASE_KEYS.includes(hash as Phase)) setActive(hash as Phase);
    const onHashChange = () => {
      const h = window.location.hash.replace("#", "");
      if (PHASE_KEYS.includes(h as Phase)) setActive(h as Phase);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setTab = (phase: Phase) => {
    setActive(phase);
    history.replaceState(null, "", `#${phase}`);
  };

  const items = ALL.filter((m) => m.phase === active);

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="tablist"
        aria-label={t("tabAria")}
        className="border-border bg-surface inline-flex rounded-md border p-1"
      >
        {PHASE_KEYS.map((key) => {
          const isActive = active === key;
          const count = ALL.filter((m) => m.phase === key).length;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "duration-fast inline-flex h-8 items-center gap-1.5 rounded-[4px] px-3 text-sm font-strong transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-fg-muted hover:bg-bg-hover hover:text-fg",
              )}
            >
              {t(`phases.${key}`)}
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  isActive ? "opacity-90" : "opacity-60",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="text-fg-muted text-sm">{t("emptyPhase")}</li>
        ) : (
          items.map((m) => (
            <li key={m.id}>
              <article className="border-border bg-surface hover:border-primary duration-fast rounded-lg border p-4 transition-colors">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill variant={PILL_VARIANT[m.phase as Phase]} size="sm">
                        {m.phase}
                      </Pill>
                      <h3 className="text-fg font-strong text-base">
                        {m.title}
                      </h3>
                    </div>
                    <p className="text-fg-muted text-sm">{m.summary}</p>
                  </div>
                  <div className="text-fg-muted flex items-center gap-3 text-xs">
                    <span className="font-mono">{m.estimate}</span>
                    {m.issueUrl && (
                      <a
                        href={m.issueUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:text-marketing-accent inline-flex items-center gap-1 font-strong transition-colors duration-fast"
                      >
                        {t("issue")}
                        <ArrowUpRight size={9} aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
