import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A letter in an open envelope, for asking someone to check their email.
 * Adapted from GitLab SVGs `email-verification-md` (MIT; licence in
 * `illustration-colours.ts`): the letter shows lines of text instead of
 * password characters, and the sparkles are left out.
 */
export function EmailSentIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 144 144"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="72" cy="72" r="72" fill={ILLUSTRATION_COLOURS.base} />
      <path
        fill={ILLUSTRATION_COLOURS.accentStrong}
        d="M103.829 58.6l-27-20.444a8 8 0 00-9.658 0l-27 20.443A8 8 0 0037 64.977V96a8 8 0 008 8h54a8 8 0 008-8V64.977a8 8 0 00-3.171-6.378"
      />
      <path
        d="M107 66v-1.023a8 8 0 00-3.171-6.378l-27-20.443a8 8 0 00-9.658 0l-27 20.443A8 8 0 0037 64.977V96a8 8 0 008 8h54a8 8 0 008-8V74"
        {...ILLUSTRATION_STROKE}
      />
      <path
        fill={ILLUSTRATION_COLOURS.surface}
        d="M43 45h58v57H43z"
        {...ILLUSTRATION_STROKE}
        strokeLinecap="butt"
      />
      <path
        d="M53 57h38M53 65h38M53 73h24"
        {...ILLUSTRATION_STROKE}
        strokeLinecap="round"
      />
      <path
        fill={ILLUSTRATION_COLOURS.accentSubtle}
        d="M105.712 63.083c.186.68.288 1.39.288 2.112V96a7 7 0 01-7 7H45a7 7 0 01-7-7V65.195c0-.722.1-1.431.287-2.112l28.777 18.875a9 9 0 009.873 0z"
      />
      <path
        d="M38.085 61.713l29.521 19.4a8 8 0 008.787 0l29.215-19.198"
        {...ILLUSTRATION_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37 66v30a8 8 0 008 8h54a8 8 0 008-8V66"
        {...ILLUSTRATION_STROKE}
      />
    </svg>
  );
}
