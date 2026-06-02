import { ArrowUpRight, MessageCircle, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { GITHUB_REPO_URL, getDiscordInviteUrl } from "@/lib/community";
import { cn } from "@/lib/utils";

type CardProps = {
  href?: string;
  Icon: typeof Star;
  title: string;
  body: ReactNode;
  external?: boolean;
  /**
   * Honest "not yet" state (P0-4): renders a non-clickable card with a
   * "launching soon" tooltip instead of a placeholder `href="#"`.
   */
  disabled?: boolean;
  /** Tooltip shown on the disabled card. */
  disabledTitle?: string;
  /** When set, clicking the card emits this funnel event (delegated tracker). */
  analyticsEvent?: string;
};

const CARD_CLASS =
  "border-border bg-surface group duration-fast block rounded-lg border p-6 transition-all";

function Card({
  href,
  Icon,
  title,
  body,
  external = true,
  disabled = false,
  disabledTitle,
  analyticsEvent,
}: CardProps) {
  const inner = (
    <div className="flex items-start gap-3">
      <div className="bg-marketing-accent-dim text-marketing-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
        <Icon size={18} aria-hidden />
      </div>
      <div className="flex-1 space-y-1">
        <div
          className={cn(
            "font-strong flex items-center gap-1",
            disabled ? "text-tx-3" : "text-fg",
          )}
        >
          {title}
          {!disabled && external && <ArrowUpRight size={10} aria-hidden />}
        </div>
        <p className="text-fg-muted text-sm">{body}</p>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div
        aria-disabled="true"
        title={disabledTitle}
        className={cn(CARD_CLASS, "cursor-default")}
      >
        {inner}
      </div>
    );
  }

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...(analyticsEvent
        ? {
            "data-analytics-event": analyticsEvent,
            "data-analytics-source-page": true,
          }
        : {})}
      className={cn(
        CARD_CLASS,
        "hover:border-marketing-accent hover:shadow-glow-pink",
      )}
    >
      {inner}
    </a>
  );
}

/**
 * Two-up community callout. Used on Home (bottom of "Live stats") and at
 * the footer of /design-partner. The Discord card flips automatically: when
 * `NEXT_PUBLIC_DISCORD_INVITE_URL` is set it becomes a real external link;
 * otherwise it keeps the honest "launching soon" disabled state (T04 / open
 * question S6) — never a placeholder `href="#"`.
 */
export function CommunityCallout({ className }: { className?: string }) {
  const t = useTranslations("components.community");
  const discordInvite = getDiscordInviteUrl();
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <Card
        href={GITHUB_REPO_URL}
        Icon={Star}
        title={t("github.title")}
        body={t("github.body")}
        analyticsEvent="github_star_click"
      />
      {discordInvite ? (
        <Card
          href={discordInvite}
          Icon={MessageCircle}
          title={t("discord.titleLive")}
          body={t("discord.bodyLive")}
        />
      ) : (
        <Card
          disabled
          disabledTitle={t("discord.soonTitle")}
          Icon={MessageCircle}
          title={t("discord.title")}
          body={t("discord.body")}
        />
      )}
    </div>
  );
}
