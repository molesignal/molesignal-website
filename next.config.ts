import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// MDX infrastructure (T14): wires @next/mdx + remark-gfm and allows `.mdx`
// route files. Blog post bodies are still read as strings via gray-matter in
// content/blog.ts; rich MDX rendering of bodies lands in T15.
//
// Plugins are referenced by string name (not the imported function) because
// the build runs on Turbopack, which serializes plugin config to Rust and
// cannot accept JS function values. `remark-gfm` is resolved from node_modules.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  // Let `.md`/`.mdx` files act as routes/pages alongside TS/JS.
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

// next-intl plugin stays outermost so its request config wraps the final app.
export default withNextIntl(withMDX(nextConfig));
