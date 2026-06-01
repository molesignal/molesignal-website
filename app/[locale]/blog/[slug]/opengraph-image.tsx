import { ImageResponse } from "next/og";

import { getPostBySlug } from "@/content/blog";

export const alt = "molesignal blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INDIGO = "#3742c7";
const PINK = "#ba3071";
const BG_0 = "#fbfbfd";
const TX_0 = "#131825";
const FG_MUTED = "#686f8d";

// Notes:
//   - We don't export `generateStaticParams` here: the blog/[slug] page already
//     does, so Next reuses the same slug set for OG generation.
//   - We don't pin the runtime to "edge" because edge runtime + static params
//     was rejected by Next 16. The default Node runtime is fine for our scale.

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "molesignal blog";
  const excerpt = post?.excerpt ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: BG_0,
          backgroundImage: `radial-gradient(120% 80% at 50% 0%, rgba(55,66,199,0.12), transparent 70%), radial-gradient(80% 60% at 10% 100%, rgba(186,48,113,0.12), transparent 65%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo + wordmark + post indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="36" height="36" viewBox="0 0 32 32">
              <defs>
                <linearGradient id="og-post-ecg" x1="0" y1="16" x2="32" y2="16">
                  <stop offset="0%" stopColor={INDIGO} />
                  <stop offset="50%" stopColor="#1f6cbe" />
                  <stop offset="100%" stopColor="#157f3f" />
                </linearGradient>
              </defs>
              <path
                d="M0 16 H8 L10 17.5 L13 4 L18 28 L21.5 13 L23 16 H32"
                stroke="url(#og-post-ecg)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            <span style={{ fontSize: 22, fontWeight: 700, color: TX_0 }}>
              molesignal
            </span>
          </div>
          <span
            style={{
              display: "flex",
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(186,48,113,0.12)",
              color: PINK,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            blog
          </span>
        </div>

        {/* Post title + excerpt */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1000 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: TX_0,
            }}
          >
            {title}
          </div>
          {excerpt && (
            <div
              style={{
                fontSize: 22,
                lineHeight: 1.4,
                color: FG_MUTED,
              }}
            >
              {excerpt.length > 180 ? excerpt.slice(0, 180) + "…" : excerpt}
            </div>
          )}
        </div>

        {/* Footer meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: FG_MUTED,
          }}
        >
          <span>
            {post?.author ?? "molesignal team"} ·{" "}
            {post && new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(post.date))}
            {post && ` · ${post.readTimeMinutes} min`}
          </span>
          <span style={{ fontWeight: 700 }}>molesignal.io</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
