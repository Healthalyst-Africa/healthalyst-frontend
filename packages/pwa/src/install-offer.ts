/**
 * Decides how to offer installing the app. Browsers differ:
 *
 * - Chrome and Edge (Android and desktop) fire `beforeinstallprompt`; the app
 *   keeps it and shows its own "Install" button.
 * - iPhones and iPads never prompt and give websites no way to install, in any
 *   browser. The person must use Share, then Add to Home Screen, so the app
 *   explains that instead. It matters there: iOS clears a site's stored data
 *   after about seven days without use unless the app is on the home screen.
 * - Other browsers, such as desktop Safari or Firefox, get no offer.
 */

export type InstallOffer =
  /** The browser can show its install dialog when asked. */
  | "install-button"
  /** iPhone or iPad: explain Share, then Add to Home Screen. */
  | "home-screen-instructions"
  | null;

export type InstallEnvironment = {
  /** Already opened from the home screen or as an installed app. */
  isInstalled: boolean;
  /** The browser fired `beforeinstallprompt` and the event was kept. */
  hasInstallPrompt: boolean;
  userAgent: string;
  /** Distinguishes an iPad, which reports itself as a Mac, from a real Mac. */
  maximumTouchPoints: number;
  /** The person chose "Not now" recently. */
  wasDismissedRecently: boolean;
};

/** iPhones, iPods and iPads, including iPads that report a desktop Mac. */
export function isAppleMobileDevice(
  userAgent: string,
  maximumTouchPoints: number
): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maximumTouchPoints > 1;
}

export function decideInstallOffer(
  environment: InstallEnvironment
): InstallOffer {
  if (environment.isInstalled || environment.wasDismissedRecently) return null;
  if (environment.hasInstallPrompt) return "install-button";
  if (
    isAppleMobileDevice(environment.userAgent, environment.maximumTouchPoints)
  ) {
    return "home-screen-instructions";
  }
  return null;
}
