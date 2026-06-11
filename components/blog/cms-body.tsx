import { cn } from "@/lib/utils";

/**
 * Renders a CMS post body — HTML projected server-side from Payload's Lexical
 * editor. Safe by construction: the Lexical editor has no raw-HTML node type,
 * so the projection can only contain markup emitted by the converter, and the
 * CMS is first-party (same trust tier as our own MDX files).
 *
 * The class map mirrors `mdx-prose.tsx` so CMS and MDX posts render
 * identically; keep the two in sync when adjusting prose styles.
 */
export function CmsBody({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-fg text-base leading-[1.7]",
        "[&_h1]:text-display-lg [&_h1]:font-display-strong [&_h1]:mt-10 [&_h1]:mb-4 [&_h1]:tracking-tighter first:[&_h1]:mt-0",
        "[&_h2]:text-display-md [&_h2]:font-display-strong [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tighter first:[&_h2]:mt-0",
        "[&_h3]:text-display-sm [&_h3]:font-display-strong [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:tracking-tight first:[&_h3]:mt-0",
        "[&_h4]:font-strong [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-base",
        "[&_p]:my-5",
        "[&_ul]:marker:text-marketing-accent [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6",
        "[&_ol]:marker:text-fg-muted [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6",
        "[&_li]:pl-1",
        "[&_blockquote]:border-marketing-accent [&_blockquote]:text-fg-muted [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_a]:text-primary [&_a]:font-strong [&_a:hover]:text-marketing-accent [&_a]:underline [&_a]:underline-offset-2",
        "[&_strong]:font-strong",
        "[&_hr]:border-border [&_hr]:my-8",
        "[&_code]:border-marketing-code [&_code]:bg-marketing-code [&_code]:rounded [&_code]:border [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
        "[&_pre]:border-border [&_pre]:bg-marketing-code [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:p-4",
        "[&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_img]:my-6 [&_img]:rounded-lg",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
