import type { ReactNode } from "react";

export type RotatingPhotographSlide = {
  /** The word shown in the heading while this photograph is. */
  word: string;
  /** A filling, decorative photograph, such as `next/image` with `fill`. */
  photograph: ReactNode;
};

export type RotatingPhotographPanelProperties = {
  /** The heading's fixed opening, such as "Digital infrastructure for". */
  headingLead: string;
  /** Every word in full, read by screen readers after the lead. */
  spokenEnding: string;
  /** Shown instead of the rotating word under reduced motion. */
  stillWord: string;
  slides: readonly RotatingPhotographSlide[];
  /** Shown above the heading, such as a logo. */
  brand?: ReactNode;
  lede?: ReactNode;
  /** Colours the rotating word, such as a brand accent. */
  wordClassName?: string;
  pauseLabel?: string;
  playLabel?: string;
};
