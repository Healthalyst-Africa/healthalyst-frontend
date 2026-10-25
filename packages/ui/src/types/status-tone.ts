/**
 * `neutral` for inactive or not-yet-started states, `information` for work in
 * progress, `warning` for states that need someone to act, `highlight` for
 * early states such as drafts that deserve attention, `positive` for success
 * and `negative` for refusal or loss of access.
 */
export type StatusTone =
  "neutral" | "information" | "warning" | "highlight" | "positive" | "negative";
