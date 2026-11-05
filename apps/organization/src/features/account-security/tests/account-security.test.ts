import { describe, expect, it } from "vitest";
import { passwordChangeSchema } from "~/features/account-security/schemas/password-change-schema";
import { describeSessionDevice } from "~/features/account-security/utilities/describe-session-device";
import { resolveAccountSecurityReturn } from "~/features/account-security/utilities/resolve-account-security-return";

const VALID_VALUES = {
  currentPassword: "current-password-value",
  newPassword: "new-password-value",
  confirmPassword: "new-password-value",
};

function readFieldErrors(values: Record<string, string>) {
  const result = passwordChangeSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [String(issue.path[0]), issue.message])
  );
}

describe("passwordChangeSchema", () => {
  it("accepts a new password that is long enough and confirmed", () => {
    expect(passwordChangeSchema.safeParse(VALID_VALUES).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(
      readFieldErrors({ ...VALID_VALUES, currentPassword: "" })
    ).toMatchObject({ currentPassword: "Current password is required." });
  });

  it("rejects a new password shorter than the privileged minimum", () => {
    expect(
      readFieldErrors({
        ...VALID_VALUES,
        newPassword: "short",
        confirmPassword: "short",
      })
    ).toMatchObject({
      newPassword: "New password must be at least 12 characters.",
    });
  });

  it("asks for matching passwords", () => {
    expect(
      readFieldErrors({ ...VALID_VALUES, confirmPassword: "something-else-1" })
    ).toMatchObject({ confirmPassword: "Passwords do not match." });
  });

  it("rejects reusing the current password", () => {
    expect(
      readFieldErrors({
        currentPassword: VALID_VALUES.newPassword,
        newPassword: VALID_VALUES.newPassword,
        confirmPassword: VALID_VALUES.newPassword,
      })
    ).toMatchObject({
      newPassword: "Choose a password you are not using now.",
    });
  });
});

describe("describeSessionDevice", () => {
  it.each([
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      "Chrome on Windows",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
      "Edge on Windows",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
      "Safari on macOS",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0 Mobile/15E148 Safari/604.1",
      "Chrome on iPhone",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
      "Chrome on Android",
    ],
    [
      "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0",
      "Firefox on Linux",
    ],
  ])("names %s", (userAgent, expectedName) => {
    expect(describeSessionDevice(userAgent)).toBe(expectedName);
  });

  it("falls back when the browser is not known", () => {
    expect(describeSessionDevice(null)).toBe("Unknown device");
    expect(describeSessionDevice("curl/8.5.0")).toBe("Unknown device");
  });
});

describe("resolveAccountSecurityReturn", () => {
  const productAddresses = {
    HEALTHSCHEDULE: "https://schedule.example.test",
  };

  it("returns to the product that linked here", () => {
    expect(
      resolveAccountSecurityReturn({
        returnProductCode: "HEALTHSCHEDULE",
        isApproved: true,
        productAddresses,
      })
    ).toEqual({
      href: "https://schedule.example.test",
      label: "HealthSchedule",
      isProductApplication: true,
    });
  });

  it("returns to the products page when the product has no configured address", () => {
    expect(
      resolveAccountSecurityReturn({
        returnProductCode: "LABCONNECT",
        isApproved: true,
        productAddresses,
      })
    ).toMatchObject({ href: "/products", label: "Products" });
  });

  it("returns to the application while the organisation is not approved", () => {
    expect(
      resolveAccountSecurityReturn({
        returnProductCode: "HEALTHSCHEDULE",
        isApproved: false,
        productAddresses,
      })
    ).toMatchObject({
      href: "/onboarding",
      label: "Your application",
    });
  });

  it("returns to the products page when no product linked here", () => {
    expect(
      resolveAccountSecurityReturn({
        returnProductCode: undefined,
        isApproved: true,
        productAddresses,
      })
    ).toMatchObject({ href: "/products", isProductApplication: false });
  });
});
