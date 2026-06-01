import { codeToHtml, type BundledLanguage } from "shiki";

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
  return codeToHtml(code, {
    lang: language,
    themes: {
      light: THEME_LIGHT,
      dark: THEME_DARK,
    },
    defaultColor: false,
  });
}
