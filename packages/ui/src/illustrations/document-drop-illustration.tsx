import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A folder receiving a file, for upload and drop zones. Adapted from GitLab
 * SVGs `empty-artifacts-md` (MIT; licence in `illustration-colours.ts`), with
 * the warning badge removed.
 */
export function DocumentDropIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 144 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="144" height="144" rx="72" fill={ILLUSTRATION_COLOURS.base} />
      <path
        d="M54 54h58v33a8 8 0 01-8 8H48c4 0 6-3 6-6V54z"
        fill={ILLUSTRATION_COLOURS.surface}
      />
      <path
        d="M101.92 47v7.04H54V89a6 6 0 01-12 0V39h23l7 8h29.92z"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
      />
      <path
        d="M102 47H72l-7-8H42v50a6 6 0 0012 0V54.04h58V87a8 8 0 01-8 8H60"
        {...ILLUSTRATION_STROKE}
      />
      <path d="M83 67.172v9m4-2l-4 4-4-4" {...ILLUSTRATION_STROKE} />
      <path
        d="M73 78v5h20v-5"
        stroke={ILLUSTRATION_STROKE.stroke}
        strokeWidth={ILLUSTRATION_STROKE.strokeWidth}
      />
    </svg>
  );
}
