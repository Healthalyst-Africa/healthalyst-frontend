import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A magnifying glass, for searches and filters with no matching results.
 * Adapted from GitLab SVGs `empty-search-md` (MIT; licence in
 * `illustration-colours.ts`).
 */
export function EmptySearchIllustration({ className }: { className?: string }) {
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
        d="M93 86l-8 8 9.843 9.843a8 8 0 0011.314 0l2.343-2.343L93 86z"
        fill={ILLUSTRATION_COLOURS.accentStrong}
      />
      <path
        d="M93 86l-8 8 9.843 9.843a8 8 0 0011.314 0l2.343-2.343L97 90m-12-4l3 3"
        {...ILLUSTRATION_STROKE}
      />
      <circle
        cx="66"
        cy="67"
        r="27"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <path
        d="M66 78l10-10m-24 5l21-21m30 15a37.008 37.008 0 00-10.837-26.163A37.001 37.001 0 0066 30"
        {...ILLUSTRATION_STROKE}
      />
    </svg>
  );
}
