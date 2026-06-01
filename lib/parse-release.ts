import type {
  ChangelogItem,
  ChangelogMeta,
  ChangelogTag,
} from "@/components/changelog-entry";
import type { GithubRelease } from "@/lib/github";

const TAG_ORDER: Record<ChangelogTag, number> = {
  breaking: 0,
  feat: 1,
  fix: 2,
  perf: 3,
  chore: 4,
};

/**
 * Pull `- feat: ...` / `- fix: ...` style lines out of a release body.
 *
 * Tolerant of common variants:
 *   - `- feat: ...`           Conventional commits
 *   - `- feat(scope): ...`    with a parenthesized scope
 *   - `* fix: ...`            asterisk bullets
 *   - `### Features` headers  — ignored (we keep the items, drop the header)
 *
 * Anything that doesn't match falls through to `proseFallback`, which the
 * ChangelogEntry can render as MDX prose under the structured list.
 */
const LINE_RE =
  /^\s*[-*]\s+(breaking(?:\schange)?|feat|fix|perf|chore)(?:\([^)]+\))?[:!]?\s+(.+?)\s*$/i;

const SECTION_HEADER_RE = /^#{1,6}\s+/;

function normalizeTag(raw: string): ChangelogTag {
  const t = raw.toLowerCase();
  if (t.startsWith("breaking")) return "breaking";
  if (t === "feat" || t === "fix" || t === "perf" || t === "chore") return t;
  return "chore";
}

/**
 * Extract structured items + the prose remainder from a release body.
 */
export function parseReleaseBody(body: string): {
  items: ChangelogItem[];
  proseRemainder: string;
} {
  const items: ChangelogItem[] = [];
  const proseLines: string[] = [];

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line) {
      proseLines.push("");
      continue;
    }
    const m = line.match(LINE_RE);
    if (m) {
      items.push({
        tag: normalizeTag(m[1]),
        text: m[2],
      });
      continue;
    }
    // Drop pure section headers ("### Features") from the prose to avoid
    // a bare header sitting next to a structured Pill list.
    if (SECTION_HEADER_RE.test(line)) continue;
    proseLines.push(line);
  }

  items.sort((a, b) => TAG_ORDER[a.tag] - TAG_ORDER[b.tag]);

  const proseRemainder = proseLines.join("\n").trim();
  return { items, proseRemainder };
}

/**
 * Map a GitHub Release to the same shape ChangelogEntry expects.
 *
 * `title` is the release name if it differs from the tag (some teams
 * write "v0.7 — Indigo brand" as the release title — we keep that).
 */
export function releaseToChangelogMeta(rel: GithubRelease): {
  meta: ChangelogMeta;
  prose: string;
  htmlUrl: string;
  prerelease: boolean;
} {
  const { items, proseRemainder } = parseReleaseBody(rel.bodyMarkdown);

  const title =
    rel.name && rel.name !== rel.tag && rel.name !== `v${rel.version}`
      ? rel.name
      : undefined;

  return {
    meta: {
      version: rel.version,
      date: rel.publishedAt,
      title,
      items,
    },
    prose: proseRemainder,
    htmlUrl: rel.htmlUrl,
    prerelease: rel.prerelease,
  };
}
