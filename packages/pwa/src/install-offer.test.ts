import { describe, expect, it } from "vitest";
import { decideInstallOffer, isAppleMobileDevice } from "./install-offer";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";
const IPAD_AS_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36";

const NOT_INSTALLED = {
  isInstalled: false,
  hasInstallPrompt: false,
  maximumTouchPoints: 0,
  wasDismissedRecently: false,
};

describe("install offer", () => {
  it("explains Add to Home Screen on iPhones and iPads", () => {
    expect(
      decideInstallOffer({
        ...NOT_INSTALLED,
        userAgent: IPHONE,
        maximumTouchPoints: 5,
      })
    ).toBe("home-screen-instructions");
    expect(
      decideInstallOffer({
        ...NOT_INSTALLED,
        userAgent: IPAD_AS_MAC,
        maximumTouchPoints: 5,
      })
    ).toBe("home-screen-instructions");
  });

  it("does not mistake a Mac for an iPad", () => {
    expect(isAppleMobileDevice(IPAD_AS_MAC, 0)).toBe(false);
    expect(
      decideInstallOffer({ ...NOT_INSTALLED, userAgent: IPAD_AS_MAC })
    ).toBeNull();
  });

  it("shows an install button where the browser can prompt", () => {
    expect(
      decideInstallOffer({
        ...NOT_INSTALLED,
        userAgent: ANDROID_CHROME,
        hasInstallPrompt: true,
      })
    ).toBe("install-button");
  });

  it("offers nothing once installed or after Not now", () => {
    expect(
      decideInstallOffer({
        ...NOT_INSTALLED,
        userAgent: IPHONE,
        isInstalled: true,
      })
    ).toBeNull();
    expect(
      decideInstallOffer({
        ...NOT_INSTALLED,
        userAgent: ANDROID_CHROME,
        hasInstallPrompt: true,
        wasDismissedRecently: true,
      })
    ).toBeNull();
  });

  it("offers nothing where the browser cannot install", () => {
    expect(
      decideInstallOffer({ ...NOT_INSTALLED, userAgent: ANDROID_CHROME })
    ).toBeNull();
  });
});
