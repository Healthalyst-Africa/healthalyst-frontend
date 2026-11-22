import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A calendar page with its hanging rings and empty time rows: a day with
 * nothing booked.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function EmptyCalendarDayIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="72" height="72" rx="36" fill={ILLUSTRATION_COLOURS.base} />
      <rect
        x="17"
        y="18"
        width="38"
        height="38"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M17 18h38v9H17z"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M27 14v8m18-8v8" {...ILLUSTRATION_STROKE} />
      <path d="M23 34h4M23 41h4M23 48h4" {...ILLUSTRATION_STROKE} />
      <path
        d="M33 34h16M33 41h16M33 48h16"
        {...ILLUSTRATION_STROKE}
        strokeLinecap="butt"
        strokeDasharray="2 3"
        opacity="0.6"
      />
    </svg>
  );
}
