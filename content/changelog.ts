import type { ChangelogMeta } from "@/components/changelog-entry";

/**
 * Until M5 hooks up MDX, the changelog source is this static array. After
 * MDX wiring it becomes a glob over content/changelog/*.mdx with frontmatter.
 */
export const CHANGELOG: ChangelogMeta[] = [
  {
    version: "0.7.0",
    date: "2026-05-12",
    title: "Indigo brand + cross-signal correlation UI scaffold",
    items: [
      { tag: "feat", text: "/web/correlation/* navigation: jump from a trace to its logs and host metric while preserving time window and workspace" },
      { tag: "feat", text: "Design system: 3-layer OKLCH-calibrated token cascade across all 50+ product routes" },
      { tag: "perf", text: "Parquet column-pruning planner shaves 18% off median log query latency on TSBS" },
      { tag: "fix", text: "Multi-tenant org-rewrite no longer leaks span pointers across tenants under racy ingest" },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-04-02",
    title: "Real-time alerts engine prototype",
    items: [
      { tag: "feat", text: "kind: realtime alerts evaluate inline against the write path (target <1s e2e)" },
      { tag: "feat", text: "Built-in templates for cardinality explosion, error rate, and pool saturation" },
      { tag: "chore", text: "Bump DataFusion to 39.x; planner now handles VRL expressions" },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-02-18",
    title: "Standalone docker compose profile",
    items: [
      { tag: "feat", text: "1-command sandbox via `docker compose --profile standalone up`" },
      { tag: "feat", text: "OTLP HTTP, OTLP gRPC, Vector, Fluent Bit, Prometheus remote_write ingress paths" },
      { tag: "breaking", text: "Renamed `metadata.psql` env to `metadata.postgres.dsn` for clarity" },
    ],
  },
];
