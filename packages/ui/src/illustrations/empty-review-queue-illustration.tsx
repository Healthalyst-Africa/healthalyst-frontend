import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A completed checklist, for work queues with nothing waiting. Adapted from
 * GitLab SVGs `empty-todos-all-done-md` (MIT; licence in
 * `illustration-colours.ts`), with the decorative sparkles removed.
 */
export function EmptyReviewQueueIllustration({
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
      <path d="M85 117a26.998 26.998 0 0027-27" {...ILLUSTRATION_STROKE} />
      <path
        d="M53 46.08h-9V107h42l9-9H53V46.08z"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
      />
      <path
        d="M53 46h-9v61h39.486a6 6 0 004.277-1.793L89 103.95"
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M53 37h35l12 11v42a8 8 0 01-8 8H53V37z"
        fill={ILLUSTRATION_COLOURS.surface}
      />
      <path
        d="M88 37H53v61h39a8 8 0 008-8V55.5M88 37v11h12v-.5L88 37z"
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M75 84h10m-10-4h16M75 70h8m-8-4h16M75 56h15m-15-4h7"
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M61 58v-8h8v8h-8zm0 14v-8h8v8h-8zm0 14v-8h8v8h-8z"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
    </svg>
  );
}
