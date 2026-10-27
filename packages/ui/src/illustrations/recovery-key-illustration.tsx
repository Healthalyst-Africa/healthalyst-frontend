import {
  ILLUSTRATION_COLOURS,
  ILLUSTRATION_STROKE,
} from "./illustration-colours";

/**
 * A key, for recovery codes and other ways back into an account. Adapted
 * from GitLab SVGs `empty-key-md` (MIT; licence in `illustration-colours.ts`).
 */
export function RecoveryKeyIllustration({ className }: { className?: string }) {
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
      <g {...ILLUSTRATION_STROKE}>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M87 62c0 3.802-.849 7.406-2.367 10.633L107 95v12h-5a8 8 0 01-8-8h-7v-4l-2-2h-6l-3-3-2 2-5.78-5.78c-1.989.51-4.073.78-6.22.78-13.807 0-25-11.193-25-25s11.193-25 25-25 25 11.193 25 25zm-40.894 8L70 46.106A17.556 17.556 0 0061.635 44C51.895 44 44 51.896 44 61.635c0 3.027.763 5.876 2.106 8.365z"
          fill={ILLUSTRATION_COLOURS.surface}
        />
        <path d="M81 76l25.5 25.5" />
        <path
          d="M76 51L51 76l4 4 25-25-4-4z"
          fill={ILLUSTRATION_COLOURS.accentStrong}
        />
      </g>
    </svg>
  );
}
