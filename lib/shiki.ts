import {
  bundledLanguages,
  codeToHtml,
  type BundledLanguage,
} from "shiki";

/**
 * Narrow an arbitrary fenced-code language tag (from blog MDX, where authors
 * type ``` ```yaml ``` `` etc.) to a grammar Shiki actually bundles. Unknown or
 * empty tags fall back to `bash` so a typo in content can never throw at
 * build/SSG time.
 */
export function resolveLanguage(lang?: string): BundledLanguage {
  // `Object.hasOwn` (not `in`) so inherited Object.prototype keys like
  // `toString` / `constructor` / `valueOf` used as a code-fence label don't
  // falsely resolve to a non-grammar and force the highlight() catch path.
  // Shiki's bundled aliases (`js`, `ts`, …) are own keys, so they still pass.
  if (lang && Object.hasOwn(bundledLanguages, lang)) {
    return lang as BundledLanguage;
  }
  return "bash";
}

/**
 * Module-level Shiki cache. We use the per-call API (`codeToHtml`) which
 * lazy-loads grammars on demand. This is cheaper than booting a full
 * highlighter, and Shiki internally caches grammars across calls within
 * the same Node process.
 */

const THEME_LIGHT = "vitesse-light";
const THEME_DARK = "vitesse-dark";

/**
 * Render a code string to dual-theme highlighted HTML.
 *
 * The output contains two `<pre>` blocks — Shiki's "dual theme" mode
 * (`themes`). One is shown in light mode, the other in dark. The shadcn
 * @custom-variant dark in globals.css activates the dark one via CSS.
 */
export async function highlight(
  code: string,
  language: BundledLanguage = "bash",
): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: language,
      themes: {
        light: THEME_LIGHT,
        dark: THEME_DARK,
      },
      defaultColor: false,
    });
  } catch {
    // Defensive: a grammar load failure must never break the page render.
    // Fall back to an un-highlighted but still styled block.
    return await codeToHtml(code, {
      lang: "text",
      themes: { light: THEME_LIGHT, dark: THEME_DARK },
      defaultColor: false,
    });
  }
}
