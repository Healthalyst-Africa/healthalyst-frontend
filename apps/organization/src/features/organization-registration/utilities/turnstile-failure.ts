import {
  TURNSTILE_ERROR_CODE_GROUPS,
  TURNSTILE_FAILURE_MESSAGES,
} from "~/features/organization-registration/config/turnstile";
import type {
  TurnstileFailure,
  TurnstileFailureKind,
} from "~/features/organization-registration/types/turnstile";

/** Groups a Turnstile error code by what the person can do about it. */
export function classifyTurnstileFailure(
  errorCode: string
): TurnstileFailureKind {
  for (const [kind, errorCodes] of Object.entries(
    TURNSTILE_ERROR_CODE_GROUPS
  ) as [TurnstileFailureKind, readonly string[]][]) {
    if (errorCodes.includes(errorCode)) {
      return kind;
    }
  }
  return "challenge-failed";
}

/** Only a failed challenge may pass when it runs again unchanged. */
export function canRetryTurnstileFailure(failure: TurnstileFailure): boolean {
  return failure.kind === "challenge-failed";
}

/** The message shown for a failure, ending with Cloudflare's code when known. */
export function describeTurnstileFailure(failure: TurnstileFailure): string {
  const message = TURNSTILE_FAILURE_MESSAGES[failure.kind];
  return failure.errorCode
    ? `${message} Error code ${failure.errorCode}.`
    : message;
}
