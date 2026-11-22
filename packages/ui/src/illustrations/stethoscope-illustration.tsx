import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A stethoscope: a doctor seeing a patient.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function StethoscopeIllustration({ className }: { className?: string }) {
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
      <path d="M25 15v14a11 11 0 0022 0V15" {...ILLUSTRATION_STROKE} />
      <circle
        cx="25"
        cy="14"
        r="2.5"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
      <circle
        cx="47"
        cy="14"
        r="2.5"
        fill={ILLUSTRATION_COLOURS.accentStrong}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M36 40v6a8 8 0 008 8h3" {...ILLUSTRATION_STROKE} />
      <circle
        cx="53"
        cy="54"
        r="7"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <circle cx="53" cy="54" r="3" fill={ILLUSTRATION_COLOURS.accentStrong} />
    </svg>
  );
}
