"use client";

import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import { usePlatformContextSwitchMutation } from "~/features/authentication/hooks/use-platform-authentication";
import { useSignOutMutation } from "~/features/authentication/hooks/use-sign-in";
import { useOrganizationApplicationQuery } from "~/features/organization-application/hooks/use-organization-application";

export function useOrganizationOnboardingWorkspace(session: PlatformSession) {
  const { restoreSession } = usePlatformSession();
  const signOutMutation = useSignOutMutation();
  const contextMutation = usePlatformContextSwitchMutation();
  const organizationId = session.activeContext.organizationId;
  const applicationQuery = useOrganizationApplicationQuery({
    organizationId,
    userId: session.user.id,
  });

  function selectOrganization(selectedOrganizationId: string) {
    contextMutation.mutate(
      { context: { organizationId: selectedOrganizationId } },
      { onSuccess: () => void restoreSession() }
    );
  }

  return {
    organizationId,
    applicationQuery,
    signOutMutation,
    contextMutation,
    selectOrganization,
  };
}
