import type { ReactNode } from "react";
import type { BundledLanguage } from "shiki";

import {
  CodeBlockCopy,
  type CodeBlockAnalytics,
} from "@/components/ui/code-block.client";
import { highlight } from "@/lib/shiki";
import { cn } from "@/lib/utils";

export type CodeBlockProps = {
  code: string;
  language?: BundledLanguage;
  /** Optional filename / title shown in the terminal title bar. */
  filename?: string;
  /** Class on the outer wrapper. */
  className?: string;
  /**
   * When set, copying this block emits a `quickstart_copy` funnel event. Pass
   * only where a copy is a real conversion signal (the quick-start install
   * tabs); leave undefined for incidental code blocks.
   */
  analytics?: CodeBlockAnalytics;
};

// Languages that read as a terminal session — rendered with a `$` prompt,
// dimmed comments, and bright commands. Everything else (sql, json, yaml, …)
// falls back to Shiki on the dark theme, no prompt.
const SHELL_LANGS = new Set(["bash", "sh", "shell", "zsh", "console"]);

/**
 * Terminal-styled code block. Dark in BOTH light and dark site themes — a
 * terminal is dark. macOS traffic lights + filename in the title bar; shell
 * bodies render each command line with a `$` prompt (comments dimmed, the
 * command bright, flags / URLs / strings lightly coloured) so it's obvious
 * which line you actually type.
 *
 * Server component; the only client interactivity is the copy button. Shell
 * lines are rendered from the raw string (not Shiki), which also avoids a
 * tokenizer quirk that dropped the space before flags like `--profile`.
 */
export async function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
  analytics,
}: CodeBlockProps) {
  const isShell = SHELL_LANGS.has(language);
  const html = isShell ? null : await highlight(code, language);

  return (
    <div
      data-language={language}
      className={cn(
        // Brand dark palette (mirrors the product UI's dark surfaces), not cold
        // slate, plus a soft diffuse shadow so it settles onto a light page
        // instead of hard-cutting against it. `terminal` scopes the selection
        // override in globals.css.
        "terminal overflow-hidden rounded-xl border border-white/10 bg-[#131725] text-sm shadow-[0_16px_44px_-20px_rgba(8,11,20,0.55)]",
        className,
      )}
    >
      {/* Title bar — macOS traffic lights + filename + copy */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#1a1f30] px-3 py-2.5">
        <span className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </span>
        <span className="flex-1 truncate font-mono text-xs text-slate-400">
          {filename ?? language}
        </span>
        <CodeBlockCopy code={code} analytics={analytics} />
      </div>

      {/* Body */}
      <div className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.7]">
        {isShell ? (
          <TerminalBody code={code} />
        ) : (
          <div
            className="[&_pre]:!m-0 [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:whitespace-pre"
            dangerouslySetInnerHTML={{ __html: html! }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Render shell text line by line: comments (`#…`) dimmed with no prompt,
 * command lines prefixed with a green `$ ` (continuation lines after a trailing
 * `\` get no prompt so multi-line commands read as one).
 */
type ShellLine = {
  text: string;
  kind: "blank" | "comment" | "command";
  prompt: boolean;
};

/**
 * Split shell text into classified lines. A command line shows a `$` prompt
 * unless it continues the previous one (prior command ended with a trailing
 * `\`). Kept as a plain module function so the prompt bookkeeping isn't a
 * mutation inside the component render.
 */
function parseShellLines(code: string): ShellLine[] {
  const out: ShellLine[] = [];
  let continuation = false;
  for (const text of code.replace(/\n+$/, "").split("\n")) {
    const trimmed = text.trimStart();
    if (trimmed === "") {
      continuation = false;
      out.push({ text, kind: "blank", prompt: false });
    } else if (trimmed.startsWith("#")) {
      continuation = false;
      out.push({ text, kind: "comment", prompt: false });
    } else {
      out.push({ text, kind: "command", prompt: !continuation });
      continuation = text.trimEnd().endsWith("\\");
    }
  }
  return out;
}

function TerminalBody({ code }: { code: string }) {
  // Inline `whiteSpace: pre` (not the Tailwind class) so every space — including
  // the one before a coloured flag span like `--profile` — is guaranteed to
  // render; `text-slate-50` keeps the command text bright on the dark surface.
  return (
    <div className="text-slate-50" style={{ whiteSpace: "pre" }}>
      {parseShellLines(code).map((line, i) => {
        if (line.kind === "blank") return <div key={i}>&nbsp;</div>;
        if (line.kind === "comment") {
          return (
            <div key={i} className="text-slate-500">
              {line.text}
            </div>
          );
        }
        return (
          <div key={i}>
            {line.prompt && (
              <span className="text-emerald-400 select-none">$ </span>
            )}
            {highlightShell(line.text)}
          </div>
        );
      })}
    </div>
  );
}

// URL | single/double-quoted string | flag (`-x` / `--xxx`, not a path segment).
const SHELL_TOKEN_RE =
  /(https?:\/\/[^\s'"`]+)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(?<![\w/-])(--?[A-Za-z][\w-]*)/g;

/** Light inline highlight for a shell command line, preserving every space. */
function highlightShell(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  SHELL_TOKEN_RE.lastIndex = 0;
  while ((m = SHELL_TOKEN_RE.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    if (m[1]) {
      out.push(
        <span key={k++} className="text-sky-400">
          {m[1]}
        </span>,
      );
    } else if (m[2]) {
      out.push(
        <span key={k++} className="text-amber-300">
          {m[2]}
        </span>,
      );
    } else if (m[3]) {
      out.push(
        <span key={k++} className="text-yellow-300">
          {m[3]}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
