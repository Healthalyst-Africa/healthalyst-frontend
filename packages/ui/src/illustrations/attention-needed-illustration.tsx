import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * An exclamation mark in a circle, for states that still need something from
 * the person. Adapted from GitLab SVGs `status-alert-md` (MIT; licence in
 * `illustration-colours.ts`).
 */
export function AttentionNeededIllustration({
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
      <circle cx="72" cy="72" r="72" fill={ILLUSTRATION_COLOURS.base} />
      <path
        d="M33.194 55.935a42 42 0 0052.387 55.809"
        {...ILLUSTRATION_STROKE}
      />
      <circle cx="72" cy="72" r="34.688" fill={ILLUSTRATION_COLOURS.surface} />
      <circle cx="72" cy="72" r="23.125" fill={ILLUSTRATION_COLOURS.warning} />
      <path
        d="M103.245 87.066a34.689 34.689 0 10-6.185 8.918"
        {...ILLUSTRATION_STROKE}
      />
      <circle
        cx="72.5"
        cy="82.028"
        r=".75"
        stroke={ILLUSTRATION_COLOURS.stroke}
        strokeWidth={1.5}
      />
      <path d="M72.5 62v14.056" {...ILLUSTRATION_STROKE} />
    </svg>
  );
}
