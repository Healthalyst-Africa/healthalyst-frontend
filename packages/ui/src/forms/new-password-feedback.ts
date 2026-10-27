import type { FieldStatus } from "@healthalyst/ui/types/field-status";

/** The shortest and longest password the service accepts. */
export type PasswordLengthLimits = {
  minimum: number;
  maximum: number;
};

type NewPasswordValues = {
  password: string;
  confirmation: string;
  /** Whether the person has left the password field at least once. */
  passwordVisited: boolean;
  /** Whether the person has left the confirmation field at least once. */
  confirmationVisited: boolean;
  limits: PasswordLengthLimits;
};

export type NewPasswordFeedback = {
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
  limits,
}: NewPasswordValues): NewPasswordFeedback {
  const feedback: NewPasswordFeedback = {};
  const passwordLength = [...password].length;
  const isLongEnough = passwordLength >= limits.minimum;

  if (passwordLength > limits.maximum) {
    feedback.passwordError = `Password must be no more than ${limits.maximum} characters.`;
  } else if (isLongEnough) {
    feedback.passwordStatus = {
      tone: "success",
      message: `At least ${limits.minimum} characters`,
    };
  } else if (passwordLength > 0 && passwordVisited) {
    feedback.passwordError = `Password must be at least ${limits.minimum} characters.`;
  } else if (passwordLength > 0) {
    // An empty field already shows the minimum in its placeholder.
    const remainingCount = limits.minimum - passwordLength;
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
