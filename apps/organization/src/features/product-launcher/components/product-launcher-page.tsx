"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ApplicationLauncherGrid } from "@healthalyst/ui/components/application-launcher-grid";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";
import OrganizationOnboardingLayout from "~/components/ui/organization-onboarding-layout";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { AuthenticatedApplicationRedirectState } from "~/features/authentication/components/authenticated-application-redirect-state";
import { useAuthenticatedApplicationRedirect } from "~/features/authentication/hooks/use-authenticated-application-redirect";
import { useSignOutMutation } from "~/features/authentication/hooks/use-sign-in";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import { buildProductLauncherApplications } from "~/shared/organization/components/product-launcher-applications";
import { APPROVED_ORGANIZATION_STATUS } from "~/shared/organization/config/organization-status";
import { findActiveMembership } from "~/shared/organization/utilities/find-active-membership";

/**
 * The products an approved organisation can open. Organisations that are not
 * approved yet belong in onboarding; platform staff go to Super Admin.
 */
export function ProductLauncherPage() {
  const router = useRouter();
  const {
    platformSession,
    isRestoring,
    restoreError,
    restoreSession,
    clearPlatformSession,
  } = usePlatformSession();
  const { isRedirecting, redirectError, redirectMessage } =
    useAuthenticatedApplicationRedirect({
      platformSession,
      isRestoring,
      redirectOrganizationSession: false,
    });
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
    } else if (platformSession.platformRoles.length === 0 && !isApproved) {
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

  if (isRedirecting || redirectError) {
    return (
      <OrganizationOnboardingLayout>
        <AuthenticatedApplicationRedirectState
          isRedirecting={isRedirecting}
          redirectError={redirectError}
          redirectMessage={redirectMessage}
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
          <h1 className="font-serif text-3xl font-normal leading-tight sm:text-4xl">
            Choose a product
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Open a product enabled for {membership.organization.name}. Other
            products are shown for reference.
          </p>
        </div>
        <ApplicationLauncherGrid
          applications={buildProductLauncherApplications({
            isApproved,
            enabledProductCodes: membership.products,
          })}
        />
        <p className="text-sm text-muted-foreground">
          <Link
            className="font-semibold text-primary underline underline-offset-4"
            href={ORGANIZATION_ROUTES.onboarding}
          >
            View your organisation details
          </Link>
        </p>
      </div>
    </OrganizationOnboardingLayout>
  );
}
