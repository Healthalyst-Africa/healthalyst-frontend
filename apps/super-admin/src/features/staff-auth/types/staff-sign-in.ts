import type {
  AuthenticatorSetup,
  SignInMethod,
} from "@healthalyst/platform-api/authentication-service";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export type StaffSignInStage =
  | { kind: "password" }
  | {
      kind: "verification";
      mfaToken: string;
      methods: SignInMethod[];
      method: SignInMethod;
    }
  | { kind: "enrollment-loading"; enrolmentToken: string }
  | {
      kind: "enrollment";
      enrolmentToken: string;
      setup: AuthenticatorSetup;
    }
  | {
      kind: "recovery-codes";
      staffIdentity: StaffIdentity;
      recoveryCodes: string[];
    };
