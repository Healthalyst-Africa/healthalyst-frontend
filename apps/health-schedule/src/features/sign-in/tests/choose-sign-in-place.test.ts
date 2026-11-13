import { describe, expect, it } from "vitest";
import { chooseSignInPlace } from "~/features/sign-in/utilities/choose-sign-in-place";

const DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const DESKTOP_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

describe("where HealthSchedule signs people in", () => {
  it("sends desktop browsers to the account hub", () => {
    for (const userAgent of [DESKTOP_CHROME, DESKTOP_SAFARI]) {
      expect(
        chooseSignInPlace({
          isInstalled: false,
          userAgent,
          maximumTouchPoints: 0,
        })
      ).toBe("hub");
    }
  });

  it("signs phones and tablets in on HealthSchedule's own page", () => {
    for (const userAgent of [ANDROID_PHONE, ANDROID_TABLET, IPHONE]) {
      expect(
        chooseSignInPlace({
          isInstalled: false,
          userAgent,
          maximumTouchPoints: 5,
        })
      ).toBe("in-app");
    }
  });

  it("treats an iPad that reports a Mac as a tablet", () => {
    expect(
      chooseSignInPlace({
        isInstalled: false,
        userAgent: DESKTOP_SAFARI,
        maximumTouchPoints: 5,
      })
    ).toBe("in-app");
  });

  it("trusts the browser when it says it is a mobile device", () => {
    expect(
      chooseSignInPlace({
        isInstalled: false,
        userAgent: DESKTOP_CHROME,
        maximumTouchPoints: 0,
        reportsMobile: true,
      })
    ).toBe("in-app");
  });

  it("keeps the installed app's sign-in inside the app", () => {
    expect(
      chooseSignInPlace({
        isInstalled: true,
        userAgent: DESKTOP_CHROME,
        maximumTouchPoints: 0,
      })
    ).toBe("in-app");
  });
});
