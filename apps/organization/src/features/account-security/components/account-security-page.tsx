"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";
import { StepUpDialog } from "@healthalyst/ui/components/step-up-dialog";
import OrganizationOnboardingLayout from "~/components/ui/organization-onboarding-layout";
import { getProductApplicationAddresses } from "~/config/application-addresses";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { PasswordChangeSection } from "~/features/account-security/components/password-change-section";
import { RecoveryCodesSection } from "~/features/account-security/components/recovery-codes-section";
import { SignedInSessionsSection } from "~/features/account-security/components/signed-in-sessions-section";
import { PLATFORM_SESSIONS_QUERY_KEY } from "~/features/account-security/config/account-security";
import { useStepUpProtection } from "~/features/account-security/hooks/use-step-up-protection";
import { resolveAccountSecurityReturn } from "~/features/account-security/utilities/resolve-account-security-return";
import { CODE_LENGTH } from "~/features/authentication/config/authenticator-enrolment";
import { SIGN_IN_LIMITS } from "~/features/authentication/config/authentication-limits";
import { useSignOutMutation } from "~/features/authentication/hooks/use-sign-in";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import type { OrganizationProductCode } from "~/shared/organization/config/organization-products";
import { APPROVED_ORGANIZATION_STATUS } from "~/shared/organization/config/organization-status";
import { findActiveMembership } from "~/shared/organization/utilities/find-active-membership";

/** The signed-in person's password, recovery codes and signed-in devices. */
export function AccountSecurityPage({
  returnProductCode,
}: {
  /** The product that linked here, which "Back" returns to. */
  returnProductCode?: OrganizationProductCode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    platformSession,
    isRestoring,
    restoreError,
    restoreSession,
    clearPlatformSession,
  } = usePlatformSession();
  const signOutMutation = useSignOutMutation();
  const stepUpProtection = useStepUpProtection();

  useEffect(() => {
    if (!isRestoring && !restoreError && !platformSession) {
      router.replace(ORGANIZATION_ROUTES.signIn);
    }
  }, [isRestoring, platformSession, restoreError, router]);

  if (restoreError) {
    return (
      <OrganizationOnboardingLayout>
        <StatusPanel
          tone="error"
          title="We could not restore your sign-in"
          message="Try again. If the problem continues, sign in again."
          action={
            <ActionButton
              type="button"
              variant="outline"
              isLoading={isRestoring}
              loadingText="Checking your sign-in"
              onClick={() => void restoreSession()}
            >
              Try again
            </ActionButton>
          }
        />
      </OrganizationOnboardingLayout>
    );
  }

  if (!platformSession) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Checking your sign-in"
      />
    );
  }

  const membership = findActiveMembership(platformSession);
  const returnLink = resolveAccountSecurityReturn({
    returnProductCode,
    isApproved:
      membership?.organization.status === APPROVED_ORGANIZATION_STATUS,
    productAddresses: getProductApplicationAddresses(),
  });
  const returnLinkClassName =
    "w-fit text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline";

  return (
    <OrganizationOnboardingLayout
      actions={
        <AccountMenu
          fullName={`${platformSession.user.firstName} ${platformSession.user.lastName}`}
          emailAddress={platformSession.user.email ?? ""}
          error={signOutMutation.error?.message}
          actions={[
            {
              label: "Sign out",
              pendingLabel: "Signing out…",
              isPending: signOutMutation.isPending,
              icon: <SignOutIcon aria-hidden="true" />,
              tone: "destructive",
              onSelect: () =>
                signOutMutation.mutate(undefined, {
                  onSuccess: clearPlatformSession,
                }),
            },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          {returnLink.isProductApplication ? (
            <a className={returnLinkClassName} href={returnLink.href}>
              {returnLink.label}
            </a>
          ) : (
            <Link className={returnLinkClassName} href={returnLink.href}>
              {returnLink.label}
            </Link>
          )}
          <h1 className="font-serif text-display font-normal">
            Account security
          </h1>
          <p className="max-w-2xl text-lede text-muted-foreground">
            Change your password, replace your recovery codes and sign out of
            devices you no longer use.
          </p>
        </div>

        <PasswordChangeSection
          runProtected={stepUpProtection.runProtected}
          onPasswordChanged={() =>
            void queryClient.invalidateQueries({
              queryKey: [PLATFORM_SESSIONS_QUERY_KEY, platformSession.user.id],
            })
          }
        />
        {platformSession.user.mfa.totp && (
          <RecoveryCodesSection runProtected={stepUpProtection.runProtected} />
        )}
        <SignedInSessionsSection
          userId={platformSession.user.id}
          runProtected={stepUpProtection.runProtected}
          onSignedOutEverywhere={clearPlatformSession}
        />
      </div>

      <StepUpDialog
        {...stepUpProtection.dialog}
        completingLabel="Saving"
        authenticatorCodeLength={CODE_LENGTH}
        recoveryCodeMaximumLength={SIGN_IN_LIMITS.recoveryCodeMaximum}
      />
    </OrganizationOnboardingLayout>
  );
}
