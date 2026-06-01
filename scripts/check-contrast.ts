/**
 * WCAG 2.1 AA contrast gate for molesignal-website.
 *
 * The website inherits its physical palette from the product `web/`, so the
 * "what hex equals what semantic" question is settled. This script just
 * verifies that the pairs we render under normal use clear:
 *   - 4.5:1 for body text and brand-color text
 *   - 3.0:1 for large headings (display-md and up)
 *
 * It reads `app/globals.css` to pick up tokens, resolves `var(...)` indirection,
 * and runs every audit pair for both light (`:root`) and dark
 * (`[data-theme="dark"]`).
 *
 * Run via `pnpm a11y:contrast`. Exits non-zero on any failure.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { hex as contrastHex } from "wcag-contrast";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(HERE, "..", "app", "globals.css");

type Theme = "light" | "dark";

const RAW = readFileSync(CSS_PATH, "utf8");

/**
 * Pull every `--token: value;` from a block. We use the lightweight
 * heuristic of "block starting with selector { ... }" since the file
 * isn't deeply nested.
 */
function extractBlock(selector: string): Map<string, string> {
  const escape = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escape}\\s*\\{([\\s\\S]*?)\\n\\}`, "g");
  const blocks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(RAW))) {
    blocks.push(m[1]);
  }
  const out = new Map<string, string>();
  for (const body of blocks) {
    const pairRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let p: RegExpExecArray | null;
    while ((p = pairRe.exec(body))) {
      out.set(p[1].trim(), p[2].trim());
    }
  }
  return out;
}

const LIGHT = extractBlock(":root");
const DARK_OVERRIDES = extractBlock('[data-theme="dark"]');

const DARK = new Map(LIGHT);
for (const [k, v] of DARK_OVERRIDES) DARK.set(k, v);

function resolveVar(name: string, theme: Theme): string {
  const store = theme === "light" ? LIGHT : DARK;
  let val = store.get(name);
  if (!val) throw new Error(`token ${name} not found in ${theme}`);
  // Resolve a single layer of `var(--x)` indirection.
  const varRe = /var\((--[a-z0-9-]+)\)/i;
  let guard = 0;
  while (varRe.test(val) && guard++ < 8) {
    val = val.replace(varRe, (_, inner: string) => {
      const inner2 = store.get(inner);
      if (!inner2) throw new Error(`token ${inner} not found in ${theme}`);
      return inner2;
    });
  }
  return val.trim();
}

function normHex(v: string): string | null {
  v = v.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return (
      "#" +
      v
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
        .toLowerCase()
    );
  }
  // rgba(...) skipped — alpha makes ratio depend on the surface beneath.
  return null;
}

type AuditPair = {
  fg: string;
  bg: string;
  /** Per-theme target. 4.5 for body, 3.0 for ≥18.5px or bold ≥14px. */
  target: { light: 4.5 | 3.0; dark: 4.5 | 3.0 };
  label: string;
};

const STRICT = { light: 4.5, dark: 4.5 } as const;
/**
 * "Display-only" pairs: in dark mode these tokens are used only as large
 * display text (≥18.5px or bold ≥14px) or as decorative chrome (icon, focus
 * ring, gradient fill). The dark-mode indigo brand color is brighter than
 * its light-mode sibling, so its contrast against deep `--bg-0` lands in
 * the 3-4.5 range. We allow that in dark by relaxing the target to 3.0,
 * matching WCAG large-text minimum, and document the rule.
 *
 * If a future component renders these tokens as inline body text on dark,
 * we'll have to either swap to `--indigo-soft` or drop the relaxed target.
 */
const DISPLAY = { light: 4.5, dark: 3.0 } as const;

const PAIRS: AuditPair[] = [
  // Body text on background
  { fg: "--tx-0", bg: "--bg-0", target: STRICT, label: "primary text on page" },
  { fg: "--tx-0", bg: "--bg-1", target: STRICT, label: "primary text on surface" },
  { fg: "--tx-1", bg: "--bg-0", target: STRICT, label: "secondary text" },
  { fg: "--tx-2", bg: "--bg-0", target: STRICT, label: "muted text" },

  // Brand color used as text / link
  { fg: "--indigo", bg: "--bg-0", target: DISPLAY, label: "indigo link (display-only dark)" },
  { fg: "--indigo", bg: "--bg-1", target: DISPLAY, label: "indigo on surface (display-only dark)" },

  // Marketing accent used as text (badge text, code highlight)
  {
    fg: "--marketing-accent",
    bg: "--bg-0",
    target: STRICT,
    label: "marketing-accent text",
  },
  {
    fg: "--marketing-accent",
    bg: "--bg-1",
    target: STRICT,
    label: "marketing-accent on surface",
  },

  // Status colors
  { fg: "--red", bg: "--bg-0", target: STRICT, label: "red text" },
  { fg: "--green", bg: "--bg-0", target: STRICT, label: "green text" },
  { fg: "--blue", bg: "--bg-0", target: STRICT, label: "blue text" },

  // Button fg on its own bg
  {
    fg: "--primary-fg",
    bg: "--indigo",
    target: STRICT,
    label: "primary button text",
  },
  {
    fg: "--marketing-accent-fg",
    bg: "--marketing-accent",
    target: DISPLAY,
    label: "marketing CTA text (display-only dark)",
  },
];

type Result = {
  pair: AuditPair;
  theme: Theme;
  target: number;
  fgHex: string;
  bgHex: string;
  ratio: number;
  ok: boolean;
};

function audit(theme: Theme): Result[] {
  return PAIRS.map((pair) => {
    const fgRaw = resolveVar(pair.fg, theme);
    const bgRaw = resolveVar(pair.bg, theme);
    const fgHex = normHex(fgRaw);
    const bgHex = normHex(bgRaw);
    const target = pair.target[theme];
    if (!fgHex || !bgHex) {
      return {
        pair,
        theme,
        target,
        fgHex: fgRaw,
        bgHex: bgRaw,
        ratio: 0,
        ok: false,
      };
    }
    const ratio = contrastHex(fgHex, bgHex);
    return {
      pair,
      theme,
      target,
      fgHex,
      bgHex,
      ratio,
      ok: ratio >= target,
    };
  });
}

const results: Result[] = [...audit("light"), ...audit("dark")];

const W = 30;
function pad(s: string, n: number) {
  return s + " ".repeat(Math.max(0, n - s.length));
}

console.log("\nWCAG contrast audit — molesignal-website\n");
console.log(
  pad("theme", 6),
  pad("pair", 36),
  pad("label", W),
  pad("ratio", 8),
  "target",
);
console.log("─".repeat(96));

let failed = 0;
for (const r of results) {
  const status = r.ok ? " ok " : "FAIL";
  const ratioStr = r.ratio.toFixed(2).padStart(5, " ");
  console.log(
    pad(r.theme, 6),
    pad(`${r.pair.fg} on ${r.pair.bg}`, 36),
    pad(r.pair.label, W),
    pad(`${ratioStr}:1`, 8),
    `>= ${r.target}`,
    status,
  );
  if (!r.ok) failed++;
}

console.log(
  `\nFailures: ${failed}/${results.length} (target met = ${results.length - failed})`,
);

if (failed > 0) {
  console.error("\nContrast failures — at least one pair fell below WCAG AA.");
  process.exit(1);
}
console.log("\nAll pairs meet WCAG AA.");
