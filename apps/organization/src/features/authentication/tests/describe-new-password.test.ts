import { describe, expect, it } from "vitest";
import { describeNewPassword } from "@healthalyst/ui/forms/new-password-feedback";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";

const LONG_PASSWORD = "correct horse battery";

function describeValues({
  password = "",
  confirmation = "",
  passwordVisited = false,
  confirmationVisited = false,
}: Partial<Omit<Parameters<typeof describeNewPassword>[0], "limits">>) {
  return describeNewPassword({
    password,
    confirmation,
    passwordVisited,
    confirmationVisited,
    limits: PASSWORD_LIMITS,
  });
}

describe("describeNewPassword", () => {
  it("adds nothing under an empty field, whose placeholder states the minimum", () => {
    expect(describeValues({})).toEqual({});
  });

  it("counts down while a short password is typed", () => {
    expect(describeValues({ password: "Kingsley" }).passwordStatus).toEqual({
      tone: "neutral",
      message: "4 more characters needed.",
    });
    expect(
      describeValues({ password: "KingsleyLee" }).passwordStatus?.message
    ).toBe("1 more character needed.");
  });

  it("shows a short password as an error once the field is left", () => {
    expect(
      describeValues({ password: "Kingsley", passwordVisited: true })
        .passwordError
    ).toBe("Password must be at least 12 characters.");
  });

  it("confirms a password that is long enough", () => {
    expect(describeValues({ password: LONG_PASSWORD }).passwordStatus).toEqual({
      tone: "success",
      message: "At least 12 characters",
    });
  });

  it("waits while the confirmation is still being typed", () => {
    const feedback = describeValues({
      password: LONG_PASSWORD,
      confirmation: "correct horse",
    });
    expect(feedback.confirmationError).toBeUndefined();
    expect(feedback.confirmationStatus).toBeUndefined();
  });

  it("reports a mismatch as soon as the confirmation cannot match", () => {
    expect(
      describeValues({ password: LONG_PASSWORD, confirmation: "correct hose" })
        .confirmationError
    ).toBe("Passwords do not match.");
  });

  it("reports an unfinished confirmation once the field is left", () => {
    expect(
      describeValues({
        password: LONG_PASSWORD,
        confirmation: "correct",
        confirmationVisited: true,
      }).confirmationError
    ).toBe("Passwords do not match.");
  });

  it("confirms matching passwords only when the password is long enough", () => {
    expect(
      describeValues({ password: LONG_PASSWORD, confirmation: LONG_PASSWORD })
        .confirmationStatus
    ).toEqual({ tone: "success", message: "Passwords match" });
    expect(
      describeValues({ password: "short", confirmation: "short" })
        .confirmationStatus
    ).toBeUndefined();
  });
});
