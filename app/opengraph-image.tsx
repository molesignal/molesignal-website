import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "molesignal — Logs, metrics, traces. One storage.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INDIGO = "#3742c7";
const PINK = "#ba3071";
const BG_0 = "#fbfbfd";
const TX_0 = "#131825";
const FG_MUTED = "#686f8d";

/**
 * Site-wide default Open Graph image. Used when a page doesn't override
 * via its own `opengraph-image.tsx` or `generateMetadata` `openGraph.images`.
 *
 * Uses system fonts (no Inter Variable embed) so the edge runtime stays
 * lean. The pink-magenta gradient on the title is the brand signature
 * carried into social previews.
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: BG_0,
          backgroundImage: `radial-gradient(120% 80% at 50% 0%, rgba(55,66,199,0.12), transparent 70%), radial-gradient(80% 60% at 10% 100%, rgba(186,48,113,0.12), transparent 65%)`,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="48" height="48" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="og-ecg" x1="0" y1="16" x2="32" y2="16">
                <stop offset="0%" stopColor={INDIGO} />
                <stop offset="50%" stopColor="#1f6cbe" />
                <stop offset="100%" stopColor="#157f3f" />
              </linearGradient>
            </defs>
            <path
              d="M0 16 H8 L10 17.5 L13 4 L18 28 L21.5 13 L23 16 H32"
              stroke="url(#og-ecg)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span style={{ fontSize: 32, fontWeight: 700, color: TX_0 }}>
            molesignal
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 920 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: TX_0,
            }}
          >
            What you&apos;d build if you had time.
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              background: `linear-gradient(90deg, ${INDIGO}, ${PINK})`,
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Without the Datadog bill.
          </div>
          <div style={{ fontSize: 26, color: FG_MUTED, marginTop: 12 }}>
            Logs, metrics, traces — one storage, one engine, self-hosted.
            OpenTelemetry-native.
          </div>
        </div>

        {/* Footer accent strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: FG_MUTED,
          }}
        >
          <span>github.com/molesignal/molesignal</span>
          <span
            style={{
              display: "flex",
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${PINK}`,
              color: PINK,
              fontWeight: 700,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            pre-1.0
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
