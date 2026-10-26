"use client";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import { Suspense, useEffect } from "react";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { useRouter } from "next/navigation";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";
import OrganizationOnboardingLayout from "~/components/ui/organization-onboarding-layout";
import { OrganizationOnboardingWorkspace } from "~/features/organization-application/components/organization-onboarding-workspace";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import { useAuthenticatedApplicationRedirect } from "~/features/authentication/hooks/use-authenticated-application-redirect";
import { AuthenticatedApplicationRedirectState } from "~/features/authentication/components/authenticated-application-redirect-state";

export default function OrganizationOnboardingPage() {
  const router = useRouter();
  const {
    platformSession,
    isRestoring,
    restoreError,
    restoreSession,
    clearPlatformSession,
  } = usePlatformSession();
  const { isRedirecting, redirectError } = useAuthenticatedApplicationRedirect({
    platformSession,
    isRestoring,
    redirectOrganizationSession: false,
  });

  useEffect(() => {
    if (!isRestoring && !restoreError && !platformSession) {
      router.replace(ORGANIZATION_ROUTES.signIn);
    }
  }, [isRestoring, platformSession, restoreError, router]);

  function handleSignedOut() {
    clearPlatformSession();
  }

  if (platformSession && !isRedirecting && !redirectError) {
    return (
      // The workspace reads its step from the address.
      <Suspense
        fallback={
          <BrandLoader
            markSource={BRAND_MARK_SOURCE}
            label="Opening your application"
          />
        }
      >
        <OrganizationOnboardingWorkspace
          session={platformSession}
          onSignedOut={handleSignedOut}
        />
      </Suspense>
    );
  }

  // Restoring the session or opening sign-in: show the brand, not a message.
  if (!isRedirecting && !redirectError && !restoreError) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label={isRestoring ? "Checking your sign-in" : "Opening sign in"}
      />
    );
  }

  return (
    <OrganizationOnboardingLayout>
      {isRedirecting || redirectError ? (
        <AuthenticatedApplicationRedirectState
          platformSession={platformSession}
          isRedirecting={isRedirecting}
          redirectError={redirectError}
        />
      ) : restoreError ? (
        <StatusPanel
          tone="error"
          title="We could not restore your sign-in"
          message={
            restoreError.message === "We could not restore your sign-in."
              ? "Try again. If the problem continues, sign in again."
              : restoreError.message
          }
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
      ) : null}
    </OrganizationOnboardingLayout>
  );
}
