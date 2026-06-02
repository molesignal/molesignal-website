/**
 * Community entry points (T17 / 社区入口真实化).
 *
 * The public repo is always live. The Discord invite is an external
 * prerequisite (READINESS「真实 Discord 邀请链接」, open question S6): until a
 * real invite URL is provisioned via `NEXT_PUBLIC_DISCORD_INVITE_URL`, the UI
 * keeps the honest disabled "launching soon" state (T04) rather than a
 * placeholder `href="#"` dead link. Setting the env var flips both the
 * community callout and the footer to a real external link automatically — no
 * code change needed.
 */
export const GITHUB_REPO_URL = "https://github.com/molesignal/molesignal";

/**
 * Real Discord invite URL when configured, else `null` (→ honest disabled
 * state). Trims and treats blank/whitespace as not-configured.
 */
export function getDiscordInviteUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL?.trim();
  return url ? url : null;
}
