import type { SignInMethod } from "@healthalyst/platform-api/authentication-service";

export type SignInStage =
  | { kind: "password" }
  | {
      kind: "code";
      mfaToken: string;
      methods: readonly SignInMethod[];
      method: SignInMethod;
    }
  | { kind: "enrolment-required"; enrolmentToken: string };
