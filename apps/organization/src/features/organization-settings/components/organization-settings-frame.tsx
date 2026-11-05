"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import {
  AccountSecurityIcon,
  OrganizationIcon,
  SignOutIcon,
  TeamIcon,
} from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";
import OrganizationOnboardingLayout from "~/components/ui/organization-onboarding-layout";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { useSignOutMutation } from "~/features/authentication/hooks/use-sign-in";
import { ORGANIZATION_SETTINGS_PERMISSIONS } from "~/features/organization-settings/config/organization-settings";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import { APPROVED_ORGANIZATION_STATUS } from "~/shared/organization/config/organization-status";
import { findActiveMembership } from "~/shared/organization/utilities/find-active-membership";

export type OrganizationSettingsContext = {
  platformSession: PlatformSession;
  organizationId: string;
  organizationName: string;
  userId: string;
  /** What the signed-in person may do here; the API still checks every request. */
  permissions: readonly string[];
  canEditProfile: boolean;
  canManageBranches: boolean;
};

/**
 * The signed-in frame for organisation settings pages. Only approved
 * organisations reach the content; others keep to their application.
 */
export function OrganizationSettingsFrame({
  children,
}: {
  children: (context: OrganizationSettingsContext) => ReactNode;
}) {
  const router = useRouter();
  const {
    platformSession,
    isRestoring,
    restoreError,
    restoreSession,
    clearPlatformSession,
  } = usePlatformSession();
  const signOutMutation = useSignOutMutation();
  const membership = platformSession
    ? findActiveMembership(platformSession)
    : undefined;
  const isApproved =
    membership?.organization.status === APPROVED_ORGANIZATION_STATUS;

  useEffect(() => {
    if (isRestoring || restoreError) return;
    if (!platformSession) {
      router.replace(ORGANIZATION_ROUTES.signIn);
    } else if (!isApproved) {
      router.replace(ORGANIZATION_ROUTES.onboarding);
    }
  }, [isApproved, isRestoring, platformSession, restoreError, router]);

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

  if (!platformSession || !membership || !isApproved) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label={
          isRestoring ? "Checking your sign-in" : "Opening your organisation"
        }
      />
    );
  }

  const permissions = platformSession.activeContext.permissions ?? [];

  return (
    <OrganizationOnboardingLayout
      actions={
        <AccountMenu
          fullName={`${platformSession.user.firstName} ${platformSession.user.lastName}`}
          emailAddress={platformSession.user.email ?? ""}
          error={signOutMutation.error?.message}
          actions={[
            {
              label: "Settings",
              icon: <OrganizationIcon aria-hidden="true" />,
              onSelect: () =>
                router.push(ORGANIZATION_ROUTES.organizationSettings),
            },
            {
              label: "Team",
              icon: <TeamIcon aria-hidden="true" />,
              onSelect: () => router.push(ORGANIZATION_ROUTES.team),
            },
            {
              label: "Account",
              icon: <AccountSecurityIcon aria-hidden="true" />,
              onSelect: () => router.push(ORGANIZATION_ROUTES.accountSecurity),
            },
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
      {children({
        platformSession,
        organizationId: membership.organization.id,
        organizationName: membership.organization.name,
        userId: platformSession.user.id,
        permissions,
        canEditProfile: permissions.includes(
          ORGANIZATION_SETTINGS_PERMISSIONS.updateProfile
        ),
        canManageBranches: permissions.includes(
          ORGANIZATION_SETTINGS_PERMISSIONS.manageBranches
        ),
      })}
    </OrganizationOnboardingLayout>
  );
}
