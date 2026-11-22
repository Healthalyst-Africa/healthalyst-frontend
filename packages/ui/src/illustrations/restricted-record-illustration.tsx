import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A record with an opened padlock and an alert: a restricted record opened, waiting to be checked.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function RestrictedRecordIllustration({
  className,
}: {
  className?: string;
}) {
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
        d="M18 12h23l11 11v35a2 2 0 01-2 2H18a2 2 0 01-2-2V14a2 2 0 012-2z"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M41 12v11h11M22 22h12m-12 6h16" {...ILLUSTRATION_STROKE} />
      <path d="M27 38v-5a4.5 4.5 0 019 0" {...ILLUSTRATION_STROKE} />
      <rect
        x="23"
        y="38"
        width="17"
        height="13"
        rx="2"
        fill={ILLUSTRATION_COLOURS.accentSubtle}
        {...ILLUSTRATION_STROKE}
      />
      <circle cx="31.5" cy="44.5" r="1.5" fill={ILLUSTRATION_COLOURS.stroke} />
      <circle
        cx="52"
        cy="51"
        r="9"
        fill={ILLUSTRATION_COLOURS.warning}
        {...ILLUSTRATION_STROKE}
      />
      <path d="M52 46v5" {...ILLUSTRATION_STROKE} />
      <circle cx="52" cy="55" r="1" fill={ILLUSTRATION_COLOURS.stroke} />
    </svg>
  );
}
