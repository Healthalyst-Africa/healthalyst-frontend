import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  ORGANIZATION_UNAVAILABLE_ERRORS,
  PRODUCT_SETUP_PENDING_ERRORS,
} from "~/features/product-access/config/product-access";

/** Why HealthSchedule's own check did not open the product. */
export type ProductAvailabilityFailure =
  | { status: "setup-pending" }
  | { status: "organization-unavailable" }
  | { status: "check-failed"; message: string };

function includesCode(codes: readonly string[], code: string | null) {
  return code !== null && codes.includes(code);
}

/**
 * The Platform API already listed HealthSchedule for the organisation, so a
 * refusal here usually means the approval is still reaching HealthSchedule.
 */
export function resolveProductAvailabilityFailure(
  error: unknown
): ProductAvailabilityFailure {
  if (!(error instanceof PlatformApiError)) {
    return {
      status: "check-failed",
      message: "We could not open HealthSchedule. Try again.",
    };
  }
  if (
    (error.status === 401 || error.status === 403) &&
    includesCode(PRODUCT_SETUP_PENDING_ERRORS, error.code)
  ) {
    return { status: "setup-pending" };
  }
  if (
    error.status === 403 &&
    includesCode(ORGANIZATION_UNAVAILABLE_ERRORS, error.code)
  ) {
    return { status: "organization-unavailable" };
  }
  return { status: "check-failed", message: error.message };
}
