"use client";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import { useEffect } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@healthalyst/ui/components/card";
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
      <OrganizationOnboardingWorkspace
        session={platformSession}
        onSignedOut={handleSignedOut}
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
        <Card className="border-border bg-card shadow-sm" role="alert">
          <CardContent className="flex flex-col gap-4 px-5 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold">
                We could not restore your sign-in
              </h2>
              <p className="text-sm text-muted-foreground">
                {restoreError.message === "We could not restore your sign-in."
                  ? "Try again. If the problem continues, sign in again."
                  : restoreError.message}
              </p>
            </div>
            <ActionButton
              type="button"
              variant="outline"
              isLoading={isRestoring}
              loadingText="Checking your sign-in"
              onClick={() => void restoreSession()}
            >
              Try again
            </ActionButton>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border bg-card shadow-sm" aria-busy="true">
          <CardContent className="px-5 py-6 sm:px-6 md:px-8 md:py-8">
            <p className="text-sm text-muted-foreground" role="status">
              {isRestoring ? "Checking your sign-in…" : "Opening sign in…"}
            </p>
          </CardContent>
        </Card>
      )}
    </OrganizationOnboardingLayout>
  );
}
