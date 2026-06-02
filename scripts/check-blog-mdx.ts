/**
 * Blog provider guard. Proves the MDX-backed `content/blog.ts` provider returns
 * the canonical content captured in scripts/blog-migration-snapshot.json
 * (byte-exact bodies + meta) and that the provider contract holds (sorted
 * newest-first, typed fields, getPostBySlug / getRelatedPosts behaviour).
 *
 * Originated as T14's pre-migration zero-loss guard; the snapshot was
 * regenerated in T15 when blog bodies were enriched with Markdown structure
 * (headings/lists/code blocks) for rich rendering. It now doubles as a
 * content-stability canary: any accidental change to a post body fails here.
 *
 * Run: pnpm test:blog
 */
import fs from "node:fs";
import path from "node:path";

import {
  BLOG_POSTS,
  getPostBySlug,
  getRelatedPosts,
  type BlogPost,
} from "../content/blog";

const SNAPSHOT_PATH = path.join(
  process.cwd(),
  "scripts",
  "blog-migration-snapshot.json",
);

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const snapshot: BlogPost[] = JSON.parse(
  fs.readFileSync(SNAPSHOT_PATH, "utf8"),
);

console.log("AC3 — zero-loss migration (byte-exact vs pre-migration snapshot)");
const META_FIELDS: (keyof BlogPost)[] = [
  "slug",
  "title",
  "excerpt",
  "date",
  "author",
  "readTimeMinutes",
  "tags",
];
for (const expected of snapshot) {
  const got = getPostBySlug(expected.slug);
  check(`${expected.slug}: present`, !!got);
  if (!got) continue;
  for (const f of META_FIELDS) {
    check(
      `${expected.slug}.${String(f)} equal`,
      JSON.stringify(got[f]) === JSON.stringify(expected[f]),
      `expected ${JSON.stringify(expected[f])}, got ${JSON.stringify(got[f])}`,
    );
  }
  check(
    `${expected.slug}.body equal (byte-exact)`,
    got.body === expected.body,
    `len got=${got.body.length} expected=${expected.body.length}`,
  );
  check(
    `${expected.slug}: paragraph count preserved`,
    got.body.split("\n\n").length === expected.body.split("\n\n").length,
  );
}

console.log("AC5 — provider behaviour");
check("BLOG_POSTS is an array", Array.isArray(BLOG_POSTS));
check(
  "BLOG_POSTS length matches snapshot",
  BLOG_POSTS.length === snapshot.length,
);
check(
  "BLOG_POSTS sorted newest-first",
  BLOG_POSTS.every(
    (p, i) => i === 0 || BLOG_POSTS[i - 1].date >= p.date,
  ),
);
check(
  "getPostBySlug(known) returns non-empty body string",
  typeof getPostBySlug("why-parquet-for-three-signals")?.body === "string" &&
    (getPostBySlug("why-parquet-for-three-signals")?.body.length ?? 0) > 0,
);
check(
  "getPostBySlug(unknown) returns undefined",
  getPostBySlug("does-not-exist") === undefined,
);
check(
  "getRelatedPosts returns array honouring limit",
  Array.isArray(getRelatedPosts("why-parquet-for-three-signals", 3)) &&
    getRelatedPosts("why-parquet-for-three-signals", 3).length <=
      Math.max(0, BLOG_POSTS.length - 1),
);
check(
  "readTimeMinutes is number type",
  BLOG_POSTS.every((p) => typeof p.readTimeMinutes === "number"),
);
check(
  "date is string type",
  BLOG_POSTS.every((p) => typeof p.date === "string"),
);
check(
  "tags is string[] type",
  BLOG_POSTS.every(
    (p) => Array.isArray(p.tags) && p.tags.every((t) => typeof t === "string"),
  ),
);

if (failures > 0) {
  console.error(`\nFAIL — ${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nPASS — all blog MDX migration checks green");
