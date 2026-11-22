import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * People standing one behind another, the first highlighted: a queue served in turn.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function WaitingLineIllustration({ className }: { className?: string }) {
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
      <path d="M10 56h52" {...ILLUSTRATION_STROKE} />
      <circle
        cx="51"
        cy="31"
        r="5"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M42 56v-6a9 9 0 0118 0v6"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <circle
        cx="37"
        cy="31"
        r="5"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M28 56v-6a9 9 0 0118 0v6"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
        {...ILLUSTRATION_STROKE}
      />
      <circle
        cx="23"
        cy="31"
        r="5"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M14 56v-6a9 9 0 0118 0v6"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M29 15H17m4-4l-4 4 4 4" {...ILLUSTRATION_STROKE} />
    </svg>
  );
}
