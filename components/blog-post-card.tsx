import { Clock } from "lucide-react";

import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Size = "default" | "featured" | "compact";

export type BlogPostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  author: string;
  readTimeMinutes: number;
  tags: string[];
  coverUrl?: string;
};

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * Reusable post card. Used on /blog index and at the bottom of single posts
 * for related posts. Three sizes:
 *   - "featured"  → large, cover image dominant, used at top of index
 *   - "default"   → 3-col grid item
 *   - "compact"   → no cover, dense, for "related" lists
 */
export function BlogPostCard({
  post,
  size = "default",
  className,
}: {
  post: BlogPostMeta;
  size?: Size;
  className?: string;
}) {
  const href = `/blog/${post.slug}`;

  if (size === "compact") {
    return (
      <Link
        href={href}
        className={cn(
          "border-border bg-surface hover:border-primary hover:shadow-glow-indigo group block rounded-lg border p-4 transition-all duration-fast",
          className,
        )}
      >
        <h3 className="text-fg group-hover:text-primary text-base font-strong transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-fg-muted mt-1 text-xs">
          {DATE_FMT.format(new Date(post.date))} · {post.readTimeMinutes} min
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "border-border bg-surface hover:border-primary hover:shadow-glow-indigo group flex flex-col overflow-hidden rounded-lg border transition-all duration-fast",
        size === "featured" && "md:flex-row",
        className,
      )}
    >
      {post.coverUrl && (
        <div
          className={cn(
            "bg-bg-2 aspect-[16/9] w-full overflow-hidden",
            size === "featured" && "md:aspect-square md:w-1/2",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverUrl}
            alt=""
            className="duration-slow h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 2).map((tag) => (
            <Pill key={tag} variant="default" size="sm">
              {tag}
            </Pill>
          ))}
        </div>
        <h3
          className={cn(
            "text-fg group-hover:text-primary font-display-strong transition-colors line-clamp-2",
            size === "featured" ? "text-display-md" : "text-lg",
          )}
        >
          {post.title}
        </h3>
        <p className="text-fg-muted text-sm line-clamp-3">{post.excerpt}</p>
        <div className="text-fg-muted mt-auto flex items-center gap-3 text-xs">
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          <span>{DATE_FMT.format(new Date(post.date))}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} aria-hidden />
            {post.readTimeMinutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}
