import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A person stepping through a doorway, with an arrow leading in: arriving and being checked in.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function EntranceIllustration({ className }: { className?: string }) {
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
      <path d="M12 56h48" {...ILLUSTRATION_STROKE} />
      <rect
        x="32"
        y="14"
        width="24"
        height="42"
        rx="2"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <rect
        x="36"
        y="18"
        width="16"
        height="38"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
        {...ILLUSTRATION_STROKE}
      />
      <circle
        cx="44"
        cy="30"
        r="4"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M37 56v-7a7 7 0 0114 0v7"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M12 37h14m-5-5l5 5-5 5" {...ILLUSTRATION_STROKE} />
    </svg>
  );
}
