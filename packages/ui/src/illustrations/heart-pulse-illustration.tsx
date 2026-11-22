import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A heart with a pulse line across it: taking vital signs.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function HeartPulseIllustration({ className }: { className?: string }) {
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
      <path
        d="M36 55C24 47 15 40.5 15 30.5a10.5 10.5 0 0121-3.5 10.5 10.5 0 0121 3.5C57 40.5 48 47 36 55z"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M11 37h12l4-8 5 15 4-11 3 4h22" {...ILLUSTRATION_STROKE} />
    </svg>
  );
}
