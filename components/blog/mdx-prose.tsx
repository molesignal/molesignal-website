import type { MDXComponents } from "mdx/types";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { CodeBlock } from "@/components/ui/code-block";
import { Link } from "@/i18n/navigation";
import { resolveLanguage } from "@/lib/shiki";

/**
 * Styled element map for rendering blog bodies authored in Markdown/MDX
 * (T15). Headings, lists, blockquotes, inline code and links all map to the
 * marketing design system; fenced code blocks reuse the Shiki-powered
 * `CodeBlock` server component (T15 AC②) for dual-theme syntax highlighting.
 *
 * Shared by the runtime MDX renderer (`MdxBody`) and `@next/mdx`'s global
 * `useMDXComponents` so file-based and string-based MDX render identically.
 */

type AnchorProps = ComponentPropsWithoutRef<"a">;

function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

function ProseLink({ href, children, ...rest }: AnchorProps) {
  if (href && isInternalHref(href)) {
    // Internal routes go through next-intl navigation so the active locale
    // prefix is preserved and client navigation works.
    return (
      <Link
        href={href}
        className="text-primary hover:text-marketing-accent font-strong underline underline-offset-2"
        {...rest}
      >
        {children}
      </Link>
    );
  }
  const external = !!href && /^https?:/.test(href);
  return (
    <a
      href={href}
      className="text-primary hover:text-marketing-accent font-strong underline underline-offset-2"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

/**
 * Extract the raw source string from a fenced code block. MDX renders
 * ```` ```lang ```` as `<pre><code className="language-lang">{source}</code></pre>`,
 * so we read the inner `<code>` element's props rather than the `<pre>`'s.
 */
function extractCode(child: ReactNode): { code: string; language: string } {
  const codeEl = child as {
    props?: { className?: string; children?: ReactNode };
  };
  const className = codeEl?.props?.className ?? "";
  const match = /language-([\w-]+)/.exec(className);
  const language = match?.[1] ?? "text";
  const raw = codeEl?.props?.children;
  const code = (typeof raw === "string" ? raw : String(raw ?? "")).replace(
    /\n$/,
    "",
  );
  return { code, language };
}

export const mdxProseComponents: MDXComponents = {
  h1: (props) => (
    <h2
      className="text-display-lg font-display-strong mt-10 mb-4 tracking-tighter first:mt-0"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="text-display-md font-display-strong mt-10 mb-4 tracking-tighter first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="text-display-sm font-display-strong mt-8 mb-3 tracking-tight first:mt-0"
      {...props}
    />
  ),
  h4: (props) => (
    <h4 className="text-fg mt-6 mb-2 text-base font-strong first:mt-0" {...props} />
  ),
  p: (props) => (
    <p className="text-fg my-5 text-base leading-[1.7]" {...props} />
  ),
  ul: (props) => (
    <ul
      className="text-fg my-4 list-disc space-y-1.5 pl-6 text-base leading-relaxed marker:text-marketing-accent"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="text-fg my-4 list-decimal space-y-1.5 pl-6 text-base leading-relaxed marker:text-fg-muted"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-marketing-accent text-fg-muted my-6 border-l-2 pl-4 italic"
      {...props}
    />
  ),
  a: ProseLink,
  strong: (props) => <strong className="text-fg font-strong" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  hr: () => <hr className="border-border my-8" />,
  // Inline code only — block code is intercepted by `pre` below and never
  // reaches this mapping.
  code: (props) => (
    <code
      className="border-marketing-code bg-marketing-code rounded border px-1.5 py-0.5 font-mono text-[0.85em]"
      {...props}
    />
  ),
  // Fenced code block → Shiki-highlighted CodeBlock (async server component).
  pre: ({ children }: ComponentPropsWithoutRef<"pre">) => {
    const { code, language } = extractCode(children);
    return (
      <div className="my-6">
        <CodeBlock code={code} language={resolveLanguage(language)} />
      </div>
    );
  },
};
