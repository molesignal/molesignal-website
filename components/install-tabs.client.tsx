"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Panel = { value: string; label: string; node: ReactNode };

/**
 * Install tabs: a horizontal segmented tab bar above a full-width panel.
 *
 * The server component (`QuickStartTabs`) pre-renders each CodeBlock (Shiki
 * highlighting happens on the server) and passes them in as `panels`; this
 * client shell only toggles which one is visible. Each CodeBlock owns its own
 * Copy button, so copying always copies the active tab's command.
 *
 * Replaces the shadcn `ui/tabs.tsx`, whose `data-horizontal` variants never
 * matched the `data-orientation` attribute it sets — so its root stayed a flex
 * row and the tab list rendered beside the code instead of above it.
 */
export function InstallTabs({
  panels,
  defaultValue,
  ariaLabel,
  className,
}: {
  panels: Panel[];
  defaultValue: string;
  ariaLabel: string;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue);
  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="border-border bg-surface inline-flex items-center gap-1 rounded-lg border p-1"
      >
        {panels.map((p) => {
          const isActive = p.value === active;
          return (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(p.value)}
              className={cn(
                "duration-fast rounded-md px-3 py-1.5 text-sm font-strong transition-colors outline-none",
                isActive
                  ? "bg-bg-0 text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        {panels.map((p) => (
          <div key={p.value} role="tabpanel" hidden={p.value !== active}>
            {p.node}
          </div>
        ))}
      </div>
    </div>
  );
}
