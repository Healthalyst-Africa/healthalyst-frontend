import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  EXPIRED_ENROLMENT_CODES,
  RECOVERY_CODES_FILE_NAME,
} from "~/features/authentication/config/authenticator-enrolment";

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

export function downloadRecoveryCodesFile(
  recoveryCodes: readonly string[]
): void {
  const file = new Blob(
    [
      `HealthAlyst recovery codes\nEach code signs in once when your authenticator app is unavailable.\n\n${recoveryCodes.join("\n")}\n`,
    ],
    { type: "text/plain" }
  );
  const fileAddress = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");
  downloadLink.href = fileAddress;
  downloadLink.download = RECOVERY_CODES_FILE_NAME;
  downloadLink.click();
  URL.revokeObjectURL(fileAddress);
}
