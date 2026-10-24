"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { getSuperAdminDashboardAddress } from "~/config/application-addresses";
import { ORGANIZATION_ROUTES } from "~/config/routes";

type AuthenticatedApplicationRedirectOptions = {
  platformSession: PlatformSession | null;
  isRestoring: boolean;
  redirectOrganizationSession: boolean;
};

type AuthenticatedApplicationRedirectState = {
  isRedirecting: boolean;
  redirectError: string | null;
};

export function useAuthenticatedApplicationRedirect({
  platformSession,
  isRestoring,
  redirectOrganizationSession,
}: AuthenticatedApplicationRedirectOptions): AuthenticatedApplicationRedirectState {
  const router = useRouter();
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const hasPlatformRoles = (platformSession?.platformRoles.length ?? 0) > 0;

  useEffect(() => {
    if (isRestoring || !platformSession) {
      setRedirectError(null);
      return;
    }

    if (hasPlatformRoles) {
      const superAdminDashboardAddress = getSuperAdminDashboardAddress();
      if (!superAdminDashboardAddress) {
        setRedirectError(
          "The HealthAlyst Super Admin app address is not configured. Contact your system administrator."
        );
        return;
      }

      setRedirectError(null);
      window.location.replace(superAdminDashboardAddress);
      return;
    }

    setRedirectError(null);
    if (redirectOrganizationSession) {
      router.replace(ORGANIZATION_ROUTES.application);
    }
  }, [
    hasPlatformRoles,
    isRestoring,
    platformSession,
    redirectOrganizationSession,
    router,
  ]);

  const isRedirecting = Boolean(
    platformSession &&
    !isRestoring &&
    !redirectError &&
    (hasPlatformRoles || redirectOrganizationSession)
  );

  return { isRedirecting, redirectError };
}
