import type { MDXComponents } from "mdx/types";

import { mdxProseComponents } from "@/components/blog/mdx-prose";

/**
 * Global MDX component map. Required by `@next/mdx` with the App Router (T14
 * infrastructure). Maps elements to the styled marketing prose components so
 * any file-based MDX renders consistently with the runtime-rendered blog
 * bodies (T15). The runtime renderer (`MdxBody`) passes the same map explicitly.
 */
export function useMDXComponents(
  components: MDXComponents,
): MDXComponents {
  return { ...mdxProseComponents, ...components };
}
