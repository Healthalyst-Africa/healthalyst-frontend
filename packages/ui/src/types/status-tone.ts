import type { ComponentType } from "react";

/**
 * `neutral` for inactive or not-yet-started states, `information` for work in
 * progress, `warning` for states that need someone to act, `highlight` for
 * early states such as drafts that deserve attention, `positive` for success
 * and `negative` for refusal or loss of access.
 */
export type StatusTone =
  "neutral" | "information" | "warning" | "highlight" | "positive" | "negative";

/** An icon from `@healthalyst/icons`, passed as a component, not an element. */
export type StatusIcon = ComponentType<{ className?: string }>;

/**
 * Everything a tag shows: its words, colour and icon. Features define each
 * of their tags once in this shape and pass it to `StatusLabel` or a table's
 * status cell, so no page builds a tag by hand.
 */
export type StatusPresentation = {
  label: string;
  tone: StatusTone;
  icon: StatusIcon;
};
