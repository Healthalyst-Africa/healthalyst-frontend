import type { SignInMethod } from "@healthalyst/platform-api/authentication-service";

export type SignInStage =
  | { kind: "password" }
  | {
      kind: "code";
      methods: readonly SignInMethod[];
      method: SignInMethod;
    }
  | { kind: "enrolment-required" };
