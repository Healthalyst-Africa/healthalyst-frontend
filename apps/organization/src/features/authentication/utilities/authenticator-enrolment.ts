import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { EXPIRED_ENROLMENT_CODES } from "~/features/authentication/config/authenticator-enrolment";

export function isExpiredEnrolment(error: Error | null): boolean {
  return (
    error instanceof PlatformApiError &&
    error.code !== null &&
    EXPIRED_ENROLMENT_CODES.has(error.code)
  );
}

/** The key in groups of four, easier to read and type into an app. */
export function groupSetupKey(setupKey: string): string[] {
  return setupKey.match(/.{1,4}/g) ?? [setupKey];
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
