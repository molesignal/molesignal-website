/**
 * Brief Principle 1: "Proof over promise" — the `docker compose` command on
 * the website MUST match what the parent repo's README ships. If we drift,
 * a visitor copies the website command, it fails, trust is broken.
 *
 * This script reads the canonical README in the parent repo and asserts
 * the QuickStart components on the website contain the exact same docker
 * compose / OTLP curl / SQL query strings.
 *
 * Run via `pnpm lint:quickstart` (added to package.json).
 *
 * Exits 1 on any drift with a unified-diff-like report.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const README_PATH = resolve(ROOT, "..", "README.md");
const QUICK_START_TABS = resolve(ROOT, "components", "quick-start-tabs.tsx");
const START_PAGE = resolve(ROOT, "app", "[locale]", "start", "page.tsx");
const HOME_PAGE = resolve(ROOT, "app", "[locale]", "page.tsx");

const PHRASES = {
  docker:
    "docker compose -f deploy/docker/docker-compose.yaml --profile standalone up",
  otlpUrl: "http://localhost:5080/api/v1/ingest/logs/app",
  queryUrl: "http://localhost:5080/api/v1/query",
  traceId: "abc123",
};

type Check = {
  label: string;
  needle: string;
  filePath: string;
};

const CHECKS: Check[] = [
  // docker compose command exists in three places
  { label: "docker compose in README", needle: PHRASES.docker, filePath: README_PATH },
  { label: "docker compose in QuickStartTabs", needle: PHRASES.docker, filePath: QUICK_START_TABS },
  { label: "docker compose in home page", needle: PHRASES.docker, filePath: HOME_PAGE },

  // OTLP curl URL
  { label: "OTLP ingest URL in README", needle: PHRASES.otlpUrl, filePath: README_PATH },
  { label: "OTLP ingest URL in start page", needle: PHRASES.otlpUrl, filePath: START_PAGE },

  // SQL query URL
  { label: "Query URL in README", needle: PHRASES.queryUrl, filePath: README_PATH },
  { label: "Query URL in start page", needle: PHRASES.queryUrl, filePath: START_PAGE },

  // Example trace_id used everywhere. The start page wraps it in shell-escaped
  // single quotes (`'\''abc123'\''`); README uses JSON-quoted form. We just
  // assert the literal trace_id appears in both — that's the point.
  { label: "trace_id example in README", needle: `trace_id":"${PHRASES.traceId}"`, filePath: README_PATH },
  { label: "trace_id example in start page", needle: PHRASES.traceId, filePath: START_PAGE },
];

// The canonical README lives in the *parent* product repo (`../README.md`).
// When this website is checked out standalone (e.g. its own git repo in CI),
// that sibling file is not present. In that case we honestly SKIP the
// cross-repo checks (logging which ones) rather than hard-failing, while still
// enforcing every within-repo website check. Run inside the monorepo to
// exercise the full README ↔ website sync guard.
const parentReadmePresent = existsSync(README_PATH);

let failed = 0;
let skipped = 0;
console.log("\nQuickStart sync audit — README ↔ website\n");

if (!parentReadmePresent) {
  console.log(
    `  note  parent README not found at ${README_PATH}\n` +
      `        → skipping cross-repo sync checks (run inside the monorepo to enforce);\n` +
      `        within-repo website checks still run.\n`,
  );
}

for (const c of CHECKS) {
  // Cross-repo check whose source file is unavailable in a standalone checkout.
  if (!parentReadmePresent && c.filePath === README_PATH) {
    console.log(`  skip  ${c.label} — parent README not present`);
    skipped++;
    continue;
  }

  let body: string;
  try {
    body = readFileSync(c.filePath, "utf8");
  } catch {
    console.log(`  FAIL  ${c.label} — cannot read ${c.filePath}`);
    failed++;
    continue;
  }
  if (!body.includes(c.needle)) {
    console.log(`  FAIL  ${c.label}`);
    console.log(`        needle: ${c.needle}`);
    console.log(`        file:   ${c.filePath}`);
    failed++;
  } else {
    console.log(`   ok   ${c.label}`);
  }
}

const ran = CHECKS.length - skipped;
console.log(
  `\nFailures: ${failed}/${ran} (in sync = ${ran - failed}${skipped ? `, skipped = ${skipped}` : ""})`,
);

if (failed > 0) {
  console.error("\nQuickStart drift detected. Resync the website copy with README.");
  process.exit(1);
}
console.log(
  parentReadmePresent
    ? "\nWebsite QuickStart copy is in sync with the parent README."
    : "\nWithin-repo QuickStart checks passed (cross-repo sync skipped — parent README absent).",
);
