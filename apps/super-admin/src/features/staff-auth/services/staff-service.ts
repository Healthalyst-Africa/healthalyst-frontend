import {
  confirmAuthenticator,
  getCurrentPlatformProfile,
  restorePlatformSession,
  signInWithPassword,
  switchPlatformContext,
  verifySignInCode,
  type PasswordStepResponse,
  type PlatformProfile,
  type PlatformSession,
  type SignInMethod,
} from "@healthalyst/platform-api/authentication-service";
import {
  PlatformApiError,
  toPlatformApiError,
} from "@healthalyst/platform-api/api-error";

import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export async function createStaffSession(
  emailAddress: string,
  password: string
): Promise<PasswordStepResponse> {
  try {
    return await signInWithPassword({ identifier: emailAddress, password });
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 401) {
      throw new Error("Email or password is incorrect.", { cause: error });
    }
    throw toPlatformApiError(error, "We could not sign you in. Try again.");
  }
}

export async function verifyStaffSignInCode(verification: {
  mfaToken: string;
  method: SignInMethod;
  code: string;
}): Promise<StaffIdentity> {
  const session = await verifySignInCode(verification);
  return activatePlatformStaffSession(session);
}

export async function confirmStaffAuthenticatorSetup(confirmation: {
  enrolmentToken: string;
  factorId: string;
  code: string;
}): Promise<{ staffIdentity: StaffIdentity; recoveryCodes: string[] }> {
  const confirmationResult = await confirmAuthenticator(confirmation);
  if (!confirmationResult.session) {
    throw new Error(
      "The authenticator was confirmed, but sign-in did not finish. Sign in again."
    );
  }
  return {
    staffIdentity: await activatePlatformStaffSession(
      confirmationResult.session
    ),
    recoveryCodes: confirmationResult.recoveryCodes,
  };
}

export async function getCurrentStaffIdentity(): Promise<StaffIdentity> {
  const restoredSession = await restorePlatformSession();
  return activatePlatformStaffSession(restoredSession);
}

async function activatePlatformStaffSession(
  session: PlatformSession
): Promise<StaffIdentity> {
  if (session.platformRoles.length === 0) {
    throw new PlatformApiError(
      "This account does not have HealthAlyst staff access.",
      "PERMISSION_DENIED",
      null,
      403,
      {},
      undefined
    );
  }

  if (session.activeContext.realm !== "PLATFORM") {
    await switchPlatformContext({ realm: "PLATFORM" });
  }

  try {
    const profile = await getCurrentPlatformProfile();
    if (profile.activeContext.realm !== "PLATFORM") {
      throw new Error("We could not open the HealthAlyst staff workspace.");
    }
    return toStaffIdentity(profile);
  } catch (error) {
    if (error instanceof PlatformApiError && error.status === 403) {
      throw new Error("This account does not have HealthAlyst staff access.", {
        cause: error,
      });
    }
    throw toPlatformApiError(
      error,
      "We could not open the HealthAlyst staff workspace."
    );
  }
}

function toStaffIdentity(profile: PlatformProfile): StaffIdentity {
  const fullName = `${profile.user.firstName} ${profile.user.lastName}`.trim();
  if (!profile.user.email) {
    throw new Error("This staff account does not have a work email address.");
  }
  return {
    staffAccountId: profile.user.id,
    fullName,
    emailAddress: profile.user.email,
    platformRoles: profile.platformRoles,
  };
}
