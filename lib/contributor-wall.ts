import type { Contributor } from "@/lib/github";

export type ContributorWallSize = "default" | "compact";

/** Max avatars rendered per size. Mirrors the GitHub `per_page` limit but is
 * also enforced here so the view never over-renders even if the API returns
 * more than asked. */
export const CONTRIBUTOR_WALL_LIMIT: Record<ContributorWallSize, number> = {
  compact: 12,
  default: 30,
};

/**
 * Serializable view-model for a single avatar in the contributor wall. Keeping
 * the mapping in a pure function (rather than inline in the server component)
 * lets `scripts/check-contributor-wall.ts` assert the real render path —
 * avatar `src`, profile `href`, accessible name, ordering and the per-size cap
 * — without a DOM renderer, since a server component's `await getContributors()`
 * can't be intercepted by a browser E2E.
 */
export type ContributorWallItem = {
  login: string;
  /** Profile link → `html_url`. */
  href: string;
  /** Avatar image → `avatar_url`. */
  src: string;
  /** Tooltip text; contains login + contribution count. */
  title: string;
  /** Accessible name for the link (screen readers); contains login. */
  ariaLabel: string;
};

/**
 * Build the avatar view-models from the contributors returned by
 * `getContributors`. Bot filtering already happened upstream (`type === "User"`)
 * — this layer only maps + caps, never re-fetches.
 *
 * `formatAriaLabel` is injected so the server component can supply an i18n
 * string (`"{login} 的 GitHub 主页"`); a sensible English default keeps the
 * function usable from plain scripts.
 */
export function buildContributorWallItems(
  contributors: Contributor[],
  size: ContributorWallSize,
  formatAriaLabel: (login: string) => string = (login) =>
    `${login}'s GitHub profile`,
): ContributorWallItem[] {
  const limit = CONTRIBUTOR_WALL_LIMIT[size];
  return contributors.slice(0, limit).map((c) => ({
    login: c.login,
    href: c.html_url,
    src: c.avatar_url,
    title: `${c.login} · ${c.contributions} contributions`,
    ariaLabel: formatAriaLabel(c.login),
  }));
}
