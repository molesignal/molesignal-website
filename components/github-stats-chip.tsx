import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { formatStars, getRepoStats, timeAgo } from "@/lib/github";
import { cn } from "@/lib/utils";

type Size = "chip" | "large" | "numeric";

const REPO_URL = "https://github.com/molesignal/molesignal";

/**
 * Server component. Renders the GitHub star count + last-commit recency
 * fetched from `getRepoStats()` (ISR-cached for 1h).
 *
 * Three size variants:
 *   - "chip"    → compact "★ 1.2k · 3h ago" — used in TopNav
 *   - "large"   → big card with stars + last commit on separate lines
 *   - "numeric" → number only, e.g. for inline mentions
 *
 * If the GitHub API fails (rate limit, offline build, repo not public yet),
 * falls back to "★ on GitHub" with no number, so the link still works.
 */
export async function GitHubStatsChip({
  size = "chip",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  const stats = await getRepoStats();
  const t = await getTranslations("components.githubChip");
  const stars = stats.fallback ? null : formatStars(stats.stars);
  const ago = stats.fallback ? null : timeAgo(stats.lastCommitISO);

  if (size === "numeric") {
    return (
      <span className={cn("text-fg-muted text-sm", className)}>
        {stars ?? "★"}
      </span>
    );
  }

  if (size === "large") {
    return (
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        data-analytics-event="github_star_click"
        data-analytics-source-page
        className={cn(
          "border-border bg-surface hover:border-primary hover:shadow-glow-indigo duration-fast group flex items-center gap-4 rounded-lg border p-4 transition-all",
          className,
        )}
      >
        <div className="bg-primary-bg group-hover:bg-primary-muted duration-fast flex h-12 w-12 items-center justify-center rounded-md transition-colors">
          <Star className="text-primary" size={22} aria-hidden />
        </div>
        <div className="flex flex-col">
          <span className="text-fg font-display-strong text-display-md">
            {stars ?? "★"}
          </span>
          <span className="text-fg-muted text-xs">
            {ago ? `${t("updatedPrefix")} ${ago}` : t("starOnGithub")}
          </span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noreferrer"
      title={ago ? t("lastCommitTooltip", { ago }) : t("starOnGithub")}
      data-analytics-event="github_star_click"
      data-analytics-source-page
      className={cn(
        "border-border bg-surface hover:bg-bg-hover text-fg duration-fast inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-strong transition-colors",
        className,
      )}
    >
      <Star size={12} aria-hidden className="text-marketing-accent" />
      {stars ? (
        <>
          <span>{stars}</span>
          {ago && (
            <>
              <span className="text-fg-muted">·</span>
              <span className="text-fg-muted">{ago}</span>
            </>
          )}
        </>
      ) : (
        <span>{t("starOnGithub")}</span>
      )}
    </a>
  );
}
