import { getTranslations } from "next-intl/server";

import { getContributors } from "@/lib/github";
import { cn } from "@/lib/utils";

type Size = "default" | "compact";

/**
 * Server component. Renders a grid of avatars from the GitHub contributors
 * API. Pre-1.0 the list is intentionally small — that's fine, the design
 * leans into the "first contributors" pre-1.0 narrative.
 *
 * `compact` size is used on the Home page (smaller, max 12). The default
 * size pulls up to 30 for /design-partner.
 */
export async function ContributorWall({
  size = "default",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  const limit = size === "compact" ? 12 : 30;
  const contributors = await getContributors(limit);
  const t = await getTranslations("components.contributorWall");

  if (contributors.length === 0) {
    return (
      <p className={cn("text-fg-muted text-sm", className)}>
        {t("empty")}{" "}
        <a
          href="https://github.com/molesignal/molesignal"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {t("emptyAction")}
        </a>
        .
      </p>
    );
  }

  const avatarSize = size === "compact" ? 32 : 40;

  return (
    <ul
      aria-label={t("ariaLabel")}
      className={cn(
        "flex flex-wrap gap-2",
        size === "compact" && "gap-1.5",
        className,
      )}
    >
      {contributors.map((c) => (
        <li key={c.login}>
          <a
            href={c.html_url}
            target="_blank"
            rel="noreferrer"
            title={`${c.login} · ${c.contributions} contributions`}
            className="border-border bg-surface hover:border-primary hover:shadow-glow-indigo duration-fast block overflow-hidden rounded-full border transition-all"
          >
            {/* Inline <img> avoids next/image config for a remote host that
                may not be configured yet. Pre-1.0 acceptable; M5 can swap. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.avatar_url}
              alt=""
              width={avatarSize}
              height={avatarSize}
              loading="lazy"
              decoding="async"
              className="block"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
