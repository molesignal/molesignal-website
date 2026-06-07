/**
 * Crawl the dev/preview server and assert every internal link resolves
 * to a 2xx. Internal links use either next-intl's <Link> (which renders
 * a relative path with optional locale prefix) or a bare anchor with
 * `href="/something"`.
 *
 * Usage:
 *   pnpm dev       # in another terminal
 *   pnpm lint:links
 *
 * Optional flag SITE=http://other-host:port to point at a non-default base.
 */

const SITE = process.env.SITE ?? "http://localhost:3000";
const SEEDS = [
  "/",
  "/zh",
  "/why",
  "/architecture",
  "/start",
  "/design-partner",
  "/cloud",
  "/roadmap",
  "/enterprise",
  "/security",
  "/stewardship",
  "/blog",
  "/blog/why-parquet-for-three-signals",
  "/blog/what-we-learned-from-100-incident-reviews",
  "/privacy",
  "/terms",
  "/sitemap.xml",
  "/robots.txt",
  "/opengraph-image",
];

type CheckResult = {
  url: string;
  status: number | string;
  ok: boolean;
};

async function check(path: string): Promise<CheckResult> {
  const url = path.startsWith("http") ? path : `${SITE}${path}`;
  try {
    const r = await fetch(url, { redirect: "manual" });
    return {
      url: path,
      status: r.status,
      ok: r.status >= 200 && r.status < 400,
    };
  } catch (err) {
    return {
      url: path,
      status: String((err as Error).message),
      ok: false,
    };
  }
}

const collected = new Set<string>(SEEDS);

// Extract anchor hrefs from each seed and add the unique internal ones
async function discoverInternal(path: string) {
  try {
    const r = await fetch(`${SITE}${path}`);
    if (!r.ok) return;
    const body = await r.text();
    const re = /href=["']([^"'#]+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const href = m[1];
      if (href.startsWith("/") && !href.startsWith("//")) {
        collected.add(href);
      }
    }
  } catch {
    /* nothing */
  }
}

async function main() {
  console.log(`\nLink crawl — base ${SITE}\n`);

  // First, discover additional internal links from seeds
  await Promise.all(SEEDS.map(discoverInternal));

  const results: CheckResult[] = [];
  for (const path of collected) {
    results.push(await check(path));
  }

  results.sort((a, b) => a.url.localeCompare(b.url));

  let failed = 0;
  for (const r of results) {
    const status = r.ok ? " ok " : "FAIL";
    console.log(`  ${status}  ${String(r.status).padEnd(5)} ${r.url}`);
    if (!r.ok) failed++;
  }

  console.log(`\nFailures: ${failed}/${results.length}`);
  if (failed > 0) {
    console.error("\nAt least one internal link is broken. Fix before launch.");
    process.exit(1);
  }
  process.exit(0);
}

main();
