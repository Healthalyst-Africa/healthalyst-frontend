/**
 * Where HealthSchedule's sign-in happens. On a phone or tablet, or in the
 * installed app, people sign in on HealthSchedule's own page, because an
 * installed app cannot share the browser's sign-in on every phone. In a
 * desktop browser, sign-in always happens in the HealthAlyst account hub.
 */
export const SIGN_IN_PLACE_CONFIGURATION = {
  /** Phones and tablets that say so in their browser identification. */
  mobileUserAgentPattern: /Android|iPhone|iPad|iPod|Mobile|Mobi/,
  installedDisplayModeQuery: "(display-mode: standalone)",
} as const;
