"use client";

import { useSyncExternalStore } from "react";
import { SIGN_IN_PLACE_CONFIGURATION } from "~/features/sign-in/config/sign-in-place";
import {
  chooseSignInPlace,
  type SignInPlace,
} from "~/features/sign-in/utilities/choose-sign-in-place";

type NavigatorWithDeviceDetails = Navigator & {
  /** Safari on iPhone and iPad, when opened from the home screen. */
  standalone?: boolean;
  /** Chromium's User-Agent Client Hints. */
  userAgentData?: { mobile?: boolean };
};

function readSignInPlace(): SignInPlace {
  const browserNavigator: NavigatorWithDeviceDetails = window.navigator;
  return chooseSignInPlace({
    isInstalled:
      window.matchMedia(SIGN_IN_PLACE_CONFIGURATION.installedDisplayModeQuery)
        .matches || browserNavigator.standalone === true,
    userAgent: browserNavigator.userAgent,
    maximumTouchPoints: browserNavigator.maxTouchPoints,
    reportsMobile: browserNavigator.userAgentData?.mobile,
  });
}

function subscribeToDisplayMode(onChange: () => void) {
  const displayMode = window.matchMedia(
    SIGN_IN_PLACE_CONFIGURATION.installedDisplayModeQuery
  );
  displayMode.addEventListener("change", onChange);
  return () => displayMode.removeEventListener("change", onChange);
}

/**
 * Where this device signs in. `null` until the page runs in the browser, as
 * the server cannot tell a phone from a desktop.
 */
export function useSignInPlace(): SignInPlace | null {
  return useSyncExternalStore(
    subscribeToDisplayMode,
    readSignInPlace,
    () => null
  );
}
