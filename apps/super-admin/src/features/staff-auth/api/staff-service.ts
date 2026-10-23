import { isAxiosError } from "axios";
import {
  confirmAuthenticator,
  getCurrentPlatformProfile,
  restorePlatformSession,
  signInWithPassword,
  signOut,
  startAuthenticatorSetup,
  switchPlatformContext,
  verifySignInCode,
  type AuthenticatorSetup,
  type PasswordStepResponse,
  type PlatformProfile,
  type PlatformSession,
  type SignInMethod,
} from "@healthalyst/platform-api/authentication-service";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";

export type StaffIdentity = {
  staffAccountId: string;
  fullName: string;
  emailAddress: string;
  platformRoles: string[];
};

export type { AuthenticatorSetup, PasswordStepResponse, SignInMethod };

export function explainStaffApiError(error: unknown, fallback: string): Error {
  return toPlatformApiError(error, fallback);
}

export async function createStaffSession(
  emailAddress: string,
  password: string
): Promise<PasswordStepResponse> {
  try {
    return await signInWithPassword({ identifier: emailAddress, password });
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error("Email or password is incorrect.", { cause: error });
    }
    throw toPlatformApiError(error, "We could not sign you in. Try again.");
  }
}

export async function startStaffAuthenticatorSetup(): Promise<AuthenticatorSetup> {
  return startAuthenticatorSetup();
}

export async function verifyStaffSignInCode(verification: {
  method: SignInMethod;
  code: string;
}): Promise<StaffIdentity> {
  const session = await verifySignInCode(verification);
  return activatePlatformStaffSession(session);
}

export async function confirmStaffAuthenticatorSetup(confirmation: {
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

export async function endStaffSession(): Promise<void> {
  await signOut();
}

async function activatePlatformStaffSession(
  session: PlatformSession
): Promise<StaffIdentity> {
  if (session.platformRoles.length === 0) {
    await signOut().catch(() => undefined);
    throw new Error("This account does not have HealthAlyst staff access.");
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
    if (isAxiosError(error) && error.response?.status === 403) {
      await signOut().catch(() => undefined);
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
