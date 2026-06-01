import { ArrowUpRight, MessageCircle, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = {
  href: string;
  Icon: typeof Star;
  title: string;
  body: ReactNode;
  external?: boolean;
};

function Card({ href, Icon, title, body, external = true }: CardProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="border-border bg-surface hover:border-marketing-accent hover:shadow-glow-pink group duration-fast block rounded-lg border p-6 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="bg-marketing-accent-dim text-marketing-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
          <Icon size={18} aria-hidden />
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-fg flex items-center gap-1 font-strong">
            {title}
            {external && <ArrowUpRight size={10} aria-hidden />}
          </div>
          <p className="text-fg-muted text-sm">{body}</p>
        </div>
      </div>
    </a>
  );
}

/**
 * Two-up community callout. Used on Home (bottom of "Live stats") and at
 * the footer of /design-partner. The Discord card explicitly says
 * "launching soon" until a real invite link is configured (Phase 5 open
 * question S6).
 */
export function CommunityCallout({ className }: { className?: string }) {
  const t = useTranslations("components.community");
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)}>
      <Card
        href="https://github.com/molesignal/molesignal"
        Icon={Star}
        title={t("github.title")}
        body={t("github.body")}
      />
      <Card
        href="#"
        Icon={MessageCircle}
        title={t("discord.title")}
        body={t("discord.body")}
      />
    </div>
  );
}
