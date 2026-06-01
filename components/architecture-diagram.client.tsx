"use client";

import { useCallback, useState } from "react";

import {
  Diagram,
  type DataPathNode,
} from "@/components/architecture-diagram";
import { cn } from "@/lib/utils";

/**
 * Interactive wrapper around the static SVG. Hovering or clicking a node
 * shows its tooltip; on mobile the tooltip stays sticky below the diagram
 * (no hover state).
 */
export function ArchitectureDiagramInteractive({
  nodes,
  tapText,
  className,
}: {
  nodes: DataPathNode[];
  tapText: string;
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(nodes[0]?.id ?? null);

  const onPointer = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as Element).closest("[data-node-id]");
      const id = target?.getAttribute("data-node-id");
      if (id) setActiveId(id);
    },
    [],
  );

  const active = nodes.find((n) => n.id === activeId);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="w-full overflow-x-auto pb-2">
        <div onMouseOver={onPointer} onClick={onPointer}>
          <Diagram nodes={nodes} interactive activeId={activeId} />
        </div>
      </div>
      {active?.tooltip && (
        <div
          role="status"
          aria-live="polite"
          className="border-primary-muted bg-primary-bg rounded-lg border p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary text-xs font-strong uppercase tracking-wide">
              {active.label}
            </span>
            {active.sublabel && (
              <span className="text-fg-muted text-xs">· {active.sublabel}</span>
            )}
          </div>
          <p className="text-fg text-sm leading-relaxed">{active.tooltip}</p>
        </div>
      )}
      <p className="text-fg-muted text-xs">{tapText}</p>
    </div>
  );
}
