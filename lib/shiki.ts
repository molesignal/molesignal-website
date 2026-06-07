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

const THEME_DARK = "vitesse-dark";

/**
 * Render a code string to dark-theme highlighted HTML.
 *
 * Code blocks are styled as terminals (dark in both light and dark site
 * themes), so we highlight against a single dark theme. The `<pre>` background
 * is overridden to transparent by `CodeBlock` so it sits on the terminal body.
 * Only used for non-shell languages (sql, json, …); shell commands get a
 * custom prompt-aware renderer in `CodeBlock`.
 */
export async function highlight(
  code: string,
  language: BundledLanguage = "bash",
): Promise<string> {
  try {
    return await codeToHtml(code, { lang: language, theme: THEME_DARK });
  } catch {
    // Defensive: a grammar load failure must never break the page render.
    return await codeToHtml(code, { lang: "text", theme: THEME_DARK });
  }
}
