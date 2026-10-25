import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A completed check, for confirming that everything required has been
 * received. Adapted from GitLab SVGs `status-success-md` (MIT; licence in
 * `illustration-colours.ts`).
 */
export function DocumentsCompleteIllustration({
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
      <circle
        cx="72"
        cy="72"
        r="23.125"
        fill={ILLUSTRATION_COLOURS.accentStrong}
      />
      <path
        d="M103.245 87.066a34.689 34.689 0 10-6.185 8.918M65 72.336l4.51 4.525L80.333 66"
        {...ILLUSTRATION_STROKE}
      />
    </svg>
  );
}
