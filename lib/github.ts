/**
 * GitHub API helpers. Both fetches are SSG-friendly: Next.js's extended `fetch`
 * with `next.revalidate` caches the response on the build server and refreshes
 * in the background once `revalidate` seconds elapse. No client-side fetching.
 *
 * Optional `GITHUB_TOKEN` env var raises the public rate limit (60/hour
 * unauthenticated → 5000/hour authenticated). Token can be any read-only PAT.
 */

const REPO = "molesignal/molesignal";
const API_BASE = "https://api.github.com";

const REPO_REVALIDATE_SECONDS = 60 * 60;        // 1h for stars / last commit
const CONTRIBUTORS_REVALIDATE_SECONDS = 24 * 60 * 60; // 24h for contributor wall
const RELEASES_REVALIDATE_SECONDS = 60 * 60;    // 1h for releases (drives /changelog)

type Headers = Record<string, string>;

function authHeaders(): Headers {
  const h: Headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

export type RepoStats = {
  stars: number;
  lastCommitISO: string | null;
  fallback: boolean;
};

export type Contributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

const REPO_FALLBACK: RepoStats = {
  stars: 0,
  lastCommitISO: null,
  fallback: true,
};

/**
 * Repo metadata: star count + most recent default-branch commit timestamp.
 *
 * Two endpoints (repo metadata + last commit) are fetched in parallel so a
 * single slow leg can't double the latency.
 */
export async function getRepoStats(): Promise<RepoStats> {
  try {
    const [repoRes, commitsRes] = await Promise.all([
      fetch(`${API_BASE}/repos/${REPO}`, {
        headers: authHeaders(),
        next: { revalidate: REPO_REVALIDATE_SECONDS },
      }),
      fetch(`${API_BASE}/repos/${REPO}/commits?per_page=1`, {
        headers: authHeaders(),
        next: { revalidate: REPO_REVALIDATE_SECONDS },
      }),
    ]);

    if (!repoRes.ok) {
      return REPO_FALLBACK;
    }
    const repo = (await repoRes.json()) as { stargazers_count: number };

    let lastCommitISO: string | null = null;
    if (commitsRes.ok) {
      const commits = (await commitsRes.json()) as Array<{
        commit: { author: { date: string } };
      }>;
      lastCommitISO = commits[0]?.commit?.author?.date ?? null;
    }

    return {
      stars: repo.stargazers_count,
      lastCommitISO,
      fallback: false,
    };
  } catch {
    return REPO_FALLBACK;
  }
}

export type GithubRelease = {
  /** semver-ish tag, with leading `v` preserved when present (`v0.7.0`). */
  tag: string;
  /** Stripped version label without leading `v` — used for anchors/permalinks. */
  version: string;
  /** Release name (often equal to tag, sometimes a custom title). */
  name: string;
  /** ISO 8601 publication timestamp. */
  publishedAt: string;
  /** Raw markdown body from the GitHub Release. */
  bodyMarkdown: string;
  /** Web URL to the release on GitHub. */
  htmlUrl: string;
  /** Marked as pre-release on GitHub (e.g. `0.x.x-rc.1`). */
  prerelease: boolean;
};

type GithubReleaseApi = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  created_at: string;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
};

/**
 * Fetch all published releases for the repo (excluding drafts). Sorted by
 * publication time newest-first; the GitHub API already returns that order.
 *
 * Returns [] on rate-limit / network failure so the changelog page can
 * render a graceful empty state rather than 500ing.
 */
export async function getReleases(
  limit = 30,
): Promise<GithubRelease[]> {
  try {
    const res = await fetch(
      `${API_BASE}/repos/${REPO}/releases?per_page=${limit}`,
      {
        headers: authHeaders(),
        next: { revalidate: RELEASES_REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return [];
    const raw = (await res.json()) as GithubReleaseApi[];
    return raw
      .filter((r) => !r.draft)
      .map<GithubRelease>((r) => ({
        tag: r.tag_name,
        version: r.tag_name.replace(/^v/, ""),
        name: r.name ?? r.tag_name,
        publishedAt: r.published_at ?? r.created_at,
        bodyMarkdown: r.body ?? "",
        htmlUrl: r.html_url,
        prerelease: r.prerelease,
      }));
  } catch {
    return [];
  }
}

export async function getContributors(
  limit = 30,
): Promise<Contributor[]> {
  try {
    const res = await fetch(
      `${API_BASE}/repos/${REPO}/contributors?per_page=${limit}`,
      {
        headers: authHeaders(),
        next: { revalidate: CONTRIBUTORS_REVALIDATE_SECONDS },
      },
    );
    if (!res.ok) return [];
    const raw = (await res.json()) as Array<{
      login: string;
      avatar_url: string;
      html_url: string;
      contributions: number;
      type: string;
    }>;
    return raw
      .filter((c) => c.type === "User")
      .map(({ login, avatar_url, html_url, contributions }) => ({
        login,
        avatar_url,
        html_url,
        contributions,
      }));
  } catch {
    return [];
  }
}

/**
 * Human-friendly star count. 1234 → "1.2k", 999 → "999", 1_000_000 → "1M".
 */
export function formatStars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * Human-friendly age from an ISO date. "3h ago", "5d ago", "2mo ago".
 * Avoids dayjs/date-fns to keep the bundle tiny in the chip use case.
 */
export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
