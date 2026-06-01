import type { BundledLanguage } from "shiki";

import { CodeBlockCopy } from "@/components/ui/code-block.client";
import { highlight } from "@/lib/shiki";
import { cn } from "@/lib/utils";

export type CodeBlockProps = {
  code: string;
  language?: BundledLanguage;
  /** Optional filename / title shown in the chrome strip above the code. */
  filename?: string;
  /** Class on the outer wrapper. */
  className?: string;
};

/**
 * Server component. Renders code via Shiki at build/SSG time; the only
 * client interactivity is a copy-to-clipboard button.
 *
 * Theme-aware: Shiki's dual-theme output emits two `<pre>` blocks, one for
 * `vitesse-light`, one for `vitesse-dark`. CSS in this component shows the
 * right one depending on `[data-theme]`.
 */
export async function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  const html = await highlight(code, language);

  return (
    <div
      className={cn(
        "border-marketing-code overflow-hidden rounded-lg border bg-marketing-code text-sm",
        className,
      )}
      data-language={language}
    >
      {(filename || language) && (
        <div className="border-marketing-code bg-bg-2 text-fg-muted flex items-center justify-between border-b px-3 py-1.5 text-xs">
          <span className="font-strong">{filename ?? language}</span>
          <CodeBlockCopy code={code} />
        </div>
      )}
      <div
        className="[&_pre]:overflow-x-auto [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-[1.6]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
