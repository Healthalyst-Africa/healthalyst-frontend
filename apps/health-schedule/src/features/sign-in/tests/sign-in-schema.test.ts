import { describe, expect, it } from "vitest";
import {
  authenticatorCodeSchema,
  passwordStepSchema,
  recoveryCodeSchema,
} from "~/features/sign-in/schemas/sign-in-schema";

describe("HealthSchedule sign-in", () => {
  it("needs a work email address and a password", () => {
    const result = passwordStepSchema.safeParse({
      identifier: " ",
      password: "",
    });
    expect(result.success).toBe(false);
    expect(new Set(result.error?.issues.map((issue) => issue.path[0]))).toEqual(
      new Set(["identifier", "password"])
    );
  });

  it("keeps the password exactly as typed", () => {
    expect(
      passwordStepSchema.parse({
        identifier: "  nurse@clinic.example  ",
        password: " spaces count ",
      })
    ).toEqual({
      identifier: "nurse@clinic.example",
      password: " spaces count ",
    });
  });

  it("accepts a 6-digit authenticator code typed with spaces", () => {
    expect(authenticatorCodeSchema.parse({ code: "123 456" }).code).toBe(
      "123456"
    );
    expect(authenticatorCodeSchema.safeParse({ code: "12345" }).success).toBe(
      false
    );
  });

  it("needs a recovery code of a plausible length", () => {
    expect(recoveryCodeSchema.safeParse({ code: "abc" }).success).toBe(false);
    expect(recoveryCodeSchema.safeParse({ code: "abcd-efgh" }).success).toBe(
      true
    );
  });
});
