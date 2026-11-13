import { isAppleMobileDevice } from "@healthalyst/pwa/install-offer";
import { SIGN_IN_PLACE_CONFIGURATION } from "~/features/sign-in/config/sign-in-place";

/** `in-app`: HealthSchedule's own sign-in page. `hub`: the account hub. */
export type SignInPlace = "in-app" | "hub";

export type SignInDevice = {
  /** Opened from the home screen or as an installed app. */
  isInstalled: boolean;
  userAgent: string;
  /** Distinguishes an iPad, which reports itself as a Mac, from a real Mac. */
  maximumTouchPoints: number;
  /** Chromium's own answer to "is this a mobile device", when it gives one. */
  reportsMobile?: boolean;
};

export function isMobileDevice(device: SignInDevice): boolean {
  if (device.reportsMobile) return true;
  return (
    SIGN_IN_PLACE_CONFIGURATION.mobileUserAgentPattern.test(device.userAgent) ||
    isAppleMobileDevice(device.userAgent, device.maximumTouchPoints)
  );
}

/**
 * Phones, tablets and the installed app sign in here; a desktop browser
 * signs in at the account hub.
 */
export function chooseSignInPlace(device: SignInDevice): SignInPlace {
  return device.isInstalled || isMobileDevice(device) ? "in-app" : "hub";
}
