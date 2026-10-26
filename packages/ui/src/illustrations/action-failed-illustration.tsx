import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A cross in a circle, for actions that did not succeed. Adapted from GitLab
 * SVGs `status-fail-md` (MIT; licence in `illustration-colours.ts`).
 */
export function ActionFailedIllustration({
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
      <circle cx="72" cy="72" r="23.125" fill={ILLUSTRATION_COLOURS.error} />
      <path
        d="M103.245 87.066a34.689 34.689 0 10-6.185 8.918M78.938 65.063L72 72m-6.938 6.938L72 72m0 0l6.938 6.938M72 72l-6.938-6.938"
        {...ILLUSTRATION_STROKE}
      />
    </svg>
  );
}
