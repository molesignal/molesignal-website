import type { MDXComponents } from "mdx/types";

/**
 * Global MDX component map. Required by `@next/mdx` with the App Router (T14
 * infrastructure). Empty for now — blog bodies still render as plain paragraphs
 * via content/blog.ts; T15 will map elements (headings/lists/code) to styled
 * components and wire Shiki highlighting.
 */
export function useMDXComponents(
  components: MDXComponents,
): MDXComponents {
  return { ...components };
}
