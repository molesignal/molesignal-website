import { evaluate } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";

import { mdxProseComponents } from "@/components/blog/mdx-prose";

/**
 * Render a blog post body (a Markdown/MDX string from `@/content/blog`) as rich
 * text — headings, lists, blockquotes, inline code and Shiki-highlighted code
 * blocks (T15). The body stays a `string` in the provider contract; this
 * component compiles it to React at build/SSG time via MDX `evaluate`.
 *
 * Server-only and async: it runs inside the statically-generated blog detail
 * page, so the `evaluate` (which uses `new Function`) executes in Node at build
 * time, never in the browser or on the edge. Content is first-party (our own
 * `content/blog/*.mdx` files), so evaluating it is trusted.
 */
export async function MdxBody({ source }: { source: string }) {
  const { default: Content } = await evaluate(source, {
    ...(jsxRuntime as object),
    remarkPlugins: [remarkGfm],
  } as Parameters<typeof evaluate>[1]);

  return <Content components={mdxProseComponents} />;
}
