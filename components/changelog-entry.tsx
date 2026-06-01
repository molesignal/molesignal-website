import { ArrowUpRight, Link as LinkIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

export type ChangelogTag = "feat" | "fix" | "breaking" | "chore" | "perf";

export type ChangelogItem = {
  tag: ChangelogTag;
  text: string;
};

export type ChangelogMeta = {
  version: string; // semver like "0.7.0"
  date: string; // ISO
  title?: string; // optional headline
  items: ChangelogItem[];
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const TAG_VARIANT: Record<ChangelogTag, "brand" | "marketing" | "success" | "warning" | "default"> = {
  feat: "brand",
  fix: "success",
  breaking: "warning",
  perf: "marketing",
  chore: "default",
};

/**
 * One version block in the /changelog page. Uses the version slug as an
 * anchor (`#v0-7-0`). Hovering the version shows a `#` icon that copies the
 * permalink.
 */
export function ChangelogEntry({
  entry,
  className,
  children,
  htmlUrl,
  prerelease = false,
}: {
  entry: ChangelogMeta;
  className?: string;
  /** Optional MDX prose body to render under the tagged item list. */
  children?: React.ReactNode;
  /** GitHub release URL — when present, renders "View on GitHub ↗" link. */
  htmlUrl?: string;
  /** Marks the release as a pre-release (RC, beta). Shown as a Pill. */
  prerelease?: boolean;
}) {
  const t = useTranslations("changelog");
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(
    locale === "zh" ? "zh-CN" : "en-US",
    DATE_OPTIONS,
  );
  const anchor = `v${entry.version.replace(/\./g, "-")}`;
  return (
    <article
      id={anchor}
      className={cn(
        "border-border border-b pb-section-md last:border-b-0 last:pb-0",
        className,
      )}
    >
      <header className="mb-4 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-fg font-display-strong text-display-md">
            <a
              href={`#${anchor}`}
              className="hover:text-primary inline-flex items-center gap-2 transition-colors duration-fast group"
            >
              v{entry.version}
              <LinkIcon
                size={14}
                aria-hidden
                className="text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </h2>
          {entry.title && (
            <span className="text-fg-muted text-base">{entry.title}</span>
          )}
          {prerelease && (
            <Pill variant="marketing" size="sm">
              {t("preReleasePill")}
            </Pill>
          )}
        </div>
        <div className="flex items-center gap-3">
          <time
            dateTime={entry.date}
            className="text-fg-muted text-sm tabular-nums"
          >
            {dateFmt.format(new Date(entry.date))}
          </time>
          {htmlUrl && (
            <a
              href={htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="text-fg-muted hover:text-primary duration-fast inline-flex items-center gap-1 text-xs font-strong transition-colors"
            >
              {t("githubLink")} <ArrowUpRight size={9} aria-hidden />
            </a>
          )}
        </div>
      </header>

      <ul className="space-y-2">
        {entry.items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <Pill variant={TAG_VARIANT[it.tag]} size="sm" className="mt-0.5">
              {it.tag}
            </Pill>
            <span className="text-fg flex-1 text-sm">{it.text}</span>
          </li>
        ))}
      </ul>

      {children && (
        <div className="prose prose-sm mt-4 max-w-none">{children}</div>
      )}
    </article>
  );
}
