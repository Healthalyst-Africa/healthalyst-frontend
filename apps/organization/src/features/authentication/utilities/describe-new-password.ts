import type { FieldStatus } from "@healthalyst/ui/components/dynamic-form-fields";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";

type NewPasswordValues = {
  password: string;
  confirmation: string;
  /** Whether the person has left the password field at least once. */
  passwordVisited: boolean;
  /** Whether the person has left the confirmation field at least once. */
  confirmationVisited: boolean;
};

type NewPasswordFeedback = {
  passwordError?: string;
  passwordStatus?: FieldStatus;
  confirmationError?: string;
  confirmationStatus?: FieldStatus;
};

/**
 * Live feedback for a new password and its confirmation. Progress shows while
 * someone types; a problem becomes an error only once it cannot be fixed by
 * typing on, or once they leave the field. Submission still validates both.
 */
export function describeNewPassword({
  password,
  confirmation,
  passwordVisited,
  confirmationVisited,
}: NewPasswordValues): NewPasswordFeedback {
  const feedback: NewPasswordFeedback = {};
  const passwordLength = [...password].length;
  const isLongEnough = passwordLength >= PASSWORD_LIMITS.minimum;

  if (passwordLength > PASSWORD_LIMITS.maximum) {
    feedback.passwordError = `Password must be no more than ${PASSWORD_LIMITS.maximum} characters.`;
  } else if (isLongEnough) {
    feedback.passwordStatus = {
      tone: "success",
      message: `At least ${PASSWORD_LIMITS.minimum} characters`,
    };
  } else if (passwordLength > 0 && passwordVisited) {
    feedback.passwordError = `Password must be at least ${PASSWORD_LIMITS.minimum} characters.`;
  } else if (passwordLength > 0) {
    // An empty field already shows the minimum in its placeholder.
    const remainingCount = PASSWORD_LIMITS.minimum - passwordLength;
    feedback.passwordStatus = {
      tone: "neutral",
      message: `${remainingCount} more ${remainingCount === 1 ? "character" : "characters"} needed.`,
    };
  }

  if (confirmation === "") return feedback;
  if (confirmation === password) {
    if (isLongEnough) {
      feedback.confirmationStatus = {
        tone: "success",
        message: "Passwords match",
      };
    }
    return feedback;
  }
  // Still typing the same password: wait until it differs or they move on.
  const couldStillMatch = password.startsWith(confirmation);
  if (!couldStillMatch || confirmationVisited) {
    feedback.confirmationError = "Passwords do not match.";
  }
  return feedback;
}
