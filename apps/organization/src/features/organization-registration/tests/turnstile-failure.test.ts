import { describe, expect, it } from "vitest";
import { TURNSTILE_FAILURE_MESSAGES } from "~/features/organization-registration/config/turnstile";
import {
  canRetryTurnstileFailure,
  classifyTurnstileFailure,
  describeTurnstileFailure,
} from "~/features/organization-registration/utilities/turnstile-failure";

describe("Turnstile failures", () => {
  it.each([
    ["110200", "site-not-allowed"],
    ["110100", "site-not-allowed"],
    ["400070", "site-not-allowed"],
    ["110500", "browser-not-supported"],
    ["200100", "device-clock"],
    ["200500", "blocked"],
    ["600010", "challenge-failed"],
    ["300030", "challenge-failed"],
  ] as const)("groups error code %s as %s", (errorCode, expectedKind) => {
    expect(classifyTurnstileFailure(errorCode)).toBe(expectedKind);
  });

  it("retries only challenges that failed for a passing reason", () => {
    expect(canRetryTurnstileFailure({ kind: "challenge-failed" })).toBe(true);
    expect(canRetryTurnstileFailure({ kind: "site-not-allowed" })).toBe(false);
    expect(canRetryTurnstileFailure({ kind: "blocked" })).toBe(false);
  });

  it("ends the message with Cloudflare's error code when there is one", () => {
    expect(
      describeTurnstileFailure({
        kind: "site-not-allowed",
        errorCode: "110200",
      })
    ).toBe(
      `${TURNSTILE_FAILURE_MESSAGES["site-not-allowed"]} Error code 110200.`
    );
    expect(describeTurnstileFailure({ kind: "blocked" })).toBe(
      TURNSTILE_FAILURE_MESSAGES.blocked
    );
  });
});
