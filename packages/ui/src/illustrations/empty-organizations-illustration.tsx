import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A group of members inside a circle, for organisation lists with no records.
 * Adapted from GitLab SVGs `empty-organizations-md` (MIT; licence in
 * `illustration-colours.ts`).
 */
export function EmptyOrganizationsIllustration({
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
      <circle cx="72" cy="72" r="35" fill={ILLUSTRATION_COLOURS.surface} />
      <path
        d="M106.942 69.99a35.001 35.001 0 01-55.412 30.4 35 35 0 1145.345-53.012"
        {...ILLUSTRATION_STROKE}
      />
      {[
        { horizontalCentre: 64, verticalCentre: 85 },
        { horizontalCentre: 86, verticalCentre: 72 },
        { horizontalCentre: 64, verticalCentre: 59 },
      ].map(({ horizontalCentre, verticalCentre }) => (
        <circle
          key={`${horizontalCentre}-${verticalCentre}`}
          cx={horizontalCentre}
          cy={verticalCentre}
          r="10"
          fill={ILLUSTRATION_COLOURS.accentSubtle}
          {...ILLUSTRATION_STROKE}
        />
      ))}
    </svg>
  );
}
