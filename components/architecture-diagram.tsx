import { getTranslations } from "next-intl/server";

import { ArchitectureDiagramInteractive } from "@/components/architecture-diagram.client";
import { cn } from "@/lib/utils";

export type Variant = "slim" | "full";

export type DataPathNode = {
  id: string;
  label: string;
  sublabel?: string;
  tooltip?: string;
};

/**
 * Linear data-path diagram. Used in two places:
 *   - Home (slim, static SVG, no hover)
 *   - /architecture (full, interactive — tooltips on hover/focus)
 *
 * Labels / sublabels / tooltips resolve via `architecture.nodes.*` so EN
 * and ZH carry the same shape. The node order itself stays in code so the
 * data path is a single source of truth.
 */
const NODE_IDS = ["ingest", "wal", "storage", "engine", "api"] as const;

async function buildNodes(): Promise<DataPathNode[]> {
  const t = await getTranslations("architecture.nodes");
  return NODE_IDS.map((id) => ({
    id,
    label: t(`${id}.label`),
    sublabel: t(`${id}.sublabel`),
    tooltip: t(`${id}.tooltip`),
  }));
}

export async function ArchitectureDiagram({
  variant = "full",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const nodes = await buildNodes();
  if (variant === "full") {
    const tapText = (await getTranslations("architecture"))("tapOrHover");
    return (
      <ArchitectureDiagramInteractive
        nodes={nodes}
        tapText={tapText}
        className={className}
      />
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <Diagram nodes={nodes} interactive={false} />
    </div>
  );
}

/**
 * The actual SVG. Shared by slim and full variants; the full variant wraps
 * it with the interactive layer in `architecture-diagram.client.tsx`.
 */
export function Diagram({
  nodes,
  interactive,
  activeId,
}: {
  nodes: DataPathNode[];
  interactive: boolean;
  activeId?: string | null;
}) {
  const nodeWidth = 144;
  const nodeHeight = 88;
  const gap = 28;
  const padX = 12;
  const padY = 16;
  const width =
    padX * 2 + nodes.length * nodeWidth + (nodes.length - 1) * gap;
  const height = padY * 2 + nodeHeight;

  return (
    <svg
      role="img"
      aria-label="molesignal data path"
      viewBox={`0 0 ${width} ${height}`}
      className="block min-w-[700px]"
      style={{ height: "auto", width: "100%", minWidth: 700 }}
    >
      {/* Connectors */}
      {nodes.slice(0, -1).map((_, i) => {
        const x1 = padX + (i + 1) * nodeWidth + i * gap;
        const x2 = x1 + gap;
        const y = padY + nodeHeight / 2;
        return (
          <g key={`arrow-${i}`}>
            <line
              x1={x1}
              y1={y}
              x2={x2 - 6}
              y2={y}
              stroke="var(--bd-2)"
              strokeWidth="1.5"
            />
            <polygon
              points={`${x2 - 6},${y - 4} ${x2},${y} ${x2 - 6},${y + 4}`}
              fill="var(--bd-2)"
            />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const x = padX + i * (nodeWidth + gap);
        const isActive = activeId === node.id;
        return (
          <g
            key={node.id}
            transform={`translate(${x}, ${padY})`}
            {...(interactive
              ? {
                  "data-node-id": node.id,
                  style: { cursor: "pointer" },
                }
              : {})}
          >
            <rect
              width={nodeWidth}
              height={nodeHeight}
              rx="10"
              fill={isActive ? "var(--primary-bg)" : "var(--surface)"}
              stroke={
                isActive ? "var(--indigo)" : "var(--bd-1)"
              }
              strokeWidth={isActive ? "2" : "1"}
            />
            <text
              x={nodeWidth / 2}
              y={36}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill="var(--fg)"
            >
              {node.label}
            </text>
            {node.sublabel && (
              <text
                x={nodeWidth / 2}
                y={58}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="var(--fg-muted)"
              >
                {node.sublabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
