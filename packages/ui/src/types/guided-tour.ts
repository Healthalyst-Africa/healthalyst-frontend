/** Where a step's popover sits beside its element. */
export type GuidedTourPlacement = "top" | "right" | "bottom" | "left";

export type GuidedTourStep = {
  /**
   * A CSS selector for the element the step points at, usually
   * `[data-tour="…"]`. Without one, the step is a centred message.
   */
  element?: string;
  title: string;
  description: string;
  placement?: GuidedTourPlacement;
};

/** How a tour ended: finished, or closed early by the person. */
export type GuidedTourEnding = "finished" | "closed";
