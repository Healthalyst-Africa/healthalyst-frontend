import { describe, expect, it } from "vitest";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { resolveProductAvailabilityFailure } from "~/features/product-access/utilities/resolve-product-availability";

function createError(status: number | null, code: string | null) {
  return new PlatformApiError(
    "The HealthSchedule message.",
    code,
    null,
    status,
    {},
    undefined
  );
}

describe("HealthSchedule availability failures", () => {
  it.each([
    [403, "PRODUCT_NOT_ENABLED"],
    [401, "AUTH_TOKEN_INVALID"],
  ])("treats %s %s as set-up still in progress", (status, code) => {
    expect(
      resolveProductAvailabilityFailure(createError(status, code))
    ).toEqual({ status: "setup-pending" });
  });

  it.each(["ORG_NOT_APPROVED", "ORG_SUSPENDED", "ORG_DEACTIVATED"])(
    "treats %s as the organisation being unavailable",
    (code) => {
      expect(resolveProductAvailabilityFailure(createError(403, code))).toEqual(
        { status: "organization-unavailable" }
      );
    }
  );

  it("keeps the API's message for other failures", () => {
    expect(
      resolveProductAvailabilityFailure(createError(503, "SERVICE_UNAVAILABLE"))
    ).toEqual({
      status: "check-failed",
      message: "The HealthSchedule message.",
    });
  });

  it("gives a general message for an unexpected failure", () => {
    expect(resolveProductAvailabilityFailure(new Error("broken"))).toEqual({
      status: "check-failed",
      message: "We could not open HealthSchedule. Try again.",
    });
  });
});
