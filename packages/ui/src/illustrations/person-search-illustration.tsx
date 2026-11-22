import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A magnifying glass over a person's record card: finding a patient.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function PersonSearchIllustration({
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
        x="11"
        y="17"
        width="38"
        height="29"
        rx="4"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <circle
        cx="23"
        cy="28"
        r="4"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M16 40a7 7 0 0114 0M35 26h8m-8 6h5" {...ILLUSTRATION_STROKE} />
      <circle
        cx="46"
        cy="45"
        r="10"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M41 42a5.5 5.5 0 015-3.5" {...ILLUSTRATION_STROKE} />
      <path
        d="M53.5 52.5l5.5 5.5a2.5 2.5 0 01-3.5 3.5l-5.5-5.5"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
    </svg>
  );
}
