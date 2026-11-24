import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/** One tube: its glass, the sample in its lower part, then its outline. */
function TestTube({
  left,
  top,
  sampleTop,
  sampleColour,
}: {
  left: number;
  top: number;
  sampleTop: number;
  sampleColour: string;
}) {
  return (
    <>
      <path
        d={`M${left} ${top}v30a4 4 0 008 0V${top}z`}
        fill={ILLUSTRATION_COLOURS.surface}
      />
      <path
        d={`M${left} ${sampleTop}h8v${top + 30 - sampleTop}a4 4 0 01-8 0z`}
        fill={sampleColour}
      />
      <path
        d={`M${left} ${top}v30a4 4 0 008 0V${top}M${left - 3} ${top}h14`}
        {...ILLUSTRATION_STROKE}
      />
    </>
  );
}

/**
 * Three test tubes standing in a rack, their samples showing below the
 * shelf: lab tests, their results and the tests a facility offers.
 * Drawn for HealthAlyst in the style of GitLab SVGs (MIT; licence in
 * `illustration-colours.ts`): a 72 px disc, square-capped 2 px strokes and
 * gold accents.
 */
export function TestTubesIllustration({ className }: { className?: string }) {
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
      <path d="M15 31v24M57 31v24M12 55h48" {...ILLUSTRATION_STROKE} />
      <TestTube
        left={20}
        top={16}
        sampleTop={36}
        sampleColour={ILLUSTRATION_COLOURS.accentStrong}
      />
      <TestTube
        left={32}
        top={12}
        sampleTop={30}
        sampleColour={ILLUSTRATION_COLOURS.accentSubtle}
      />
      <TestTube
        left={44}
        top={18}
        sampleTop={38}
        sampleColour={ILLUSTRATION_COLOURS.accentStrong}
      />
      <rect
        x="13"
        y="26"
        width="46"
        height="5"
        fill={ILLUSTRATION_COLOURS.surface}
        {...ILLUSTRATION_STROKE}
      />
    </svg>
  );
}
