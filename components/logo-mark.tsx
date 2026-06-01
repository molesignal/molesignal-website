/**
 * molesignal brand mark — an ECG waveform stroked with a horizontal
 * indigo → blue → green gradient. The three stops echo the three signals
 * (logs / metrics / traces), so the logo reads as "the same product that
 * shows you the three signals."
 *
 * Ported from `web/src/shell/LogoMark.tsx`. The product version used
 * `React.useId()`; we accept an `id` prop instead so this stays a pure
 * server component and renders identically on SSR/hydrate.
 */
export function LogoMark({
  size = 22,
  className,
  id = "logo-mark-ecg",
}: {
  size?: number;
  className?: string;
  id?: string;
}) {
  const gradId = `${id}-grad`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="16"
          x2="32"
          y2="16"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--indigo)" />
          <stop offset="50%" stopColor="var(--blue)" />
          <stop offset="100%" stopColor="var(--green)" />
        </linearGradient>
      </defs>
      <path
        d="M0 16 H8 L10 17.5 L13 4 L18 28 L21.5 13 L23 16 H32"
        stroke={`url(#${gradId})`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
