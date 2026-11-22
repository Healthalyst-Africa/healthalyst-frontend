import { ILLUSTRATION_COLOURS } from "./illustration-colours";

/**
 * A calendar page of empty days with an add mark: nothing is booked yet.
 * Adapted from GitLab SVGs `empty-schedule-md` (MIT; licence in
 * `illustration-colours.ts`).
 */
export function EmptyCalendarDayIllustration({
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
      <path
        d="M107 93V57H37v44h62a8 8 0 008-8z"
        fill={ILLUSTRATION_COLOURS.surface}
      />
      <path
        d="M47 74v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2zm0 14v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2zm14 0v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2zm14 0v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2zM61 74v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2zm14 0v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2zm14 0v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2z"
        stroke={ILLUSTRATION_COLOURS.stroke}
        strokeWidth={2}
      />
      <path d="M37 45h70v12H37V45z" fill={ILLUSTRATION_COLOURS.accentStrong} />
      <path
        d="M107 83v10a8 8 0 01-8 8H37V57m70 17V57m0 0V45H37v12m70 0H37"
        stroke={ILLUSTRATION_COLOURS.stroke}
        strokeWidth={2}
        strokeLinecap="square"
      />
      <path
        d="M55 50V40h5v10h-5zm29 0V40h5v10h-5z"
        fill={ILLUSTRATION_COLOURS.surface}
        stroke={ILLUSTRATION_COLOURS.stroke}
        strokeWidth={2}
      />
      <g
        stroke={ILLUSTRATION_COLOURS.stroke}
        strokeWidth={2}
        strokeLinecap="square"
      >
        <circle
          cx="101"
          cy="95"
          r="14"
          fill={ILLUSTRATION_COLOURS.accentSubtle}
        />
        <path d="M95 95h6m6 0h-6m0 0v-6m0 6v6" />
      </g>
      <path
        d="M101 117a21.992 21.992 0 0015.556-6.444A21.99 21.99 0 00123 95"
        stroke={ILLUSTRATION_COLOURS.stroke}
        strokeWidth={2}
        strokeLinecap="square"
      />
    </svg>
  );
}
