"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import {
  getProductApplicationAddresses,
  getSuperAdminDashboardAddress,
} from "~/config/application-addresses";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import {
  readRecentProductRedirect,
  rememberProductRedirect,
} from "~/features/authentication/utilities/recent-product-redirect";
import { resolveSignInDestination } from "~/features/authentication/utilities/resolve-sign-in-destination";
import type { OrganizationProductCode } from "~/shared/organization/config/organization-products";

type AuthenticatedApplicationRedirectOptions = {
  platformSession: PlatformSession | null;
  isRestoring: boolean;
  redirectOrganizationSession: boolean;
  /** Products named by the product app that sent the person to sign in. */
  requestedProductCodes?: readonly OrganizationProductCode[];
};

type AuthenticatedApplicationRedirectState = {
  isRedirecting: boolean;
  redirectError: string | null;
  redirectMessage: string;
};

const NO_REQUESTED_PRODUCTS: readonly OrganizationProductCode[] = [];

export function useAuthenticatedApplicationRedirect({
  platformSession,
  isRestoring,
  redirectOrganizationSession,
  requestedProductCodes = NO_REQUESTED_PRODUCTS,
}: AuthenticatedApplicationRedirectOptions): AuthenticatedApplicationRedirectState {
  const router = useRouter();
  const [redirectError, setRedirectError] = useState<string | null>(null);
  const [destinationMessage, setDestinationMessage] = useState<string | null>(
    null
  );
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
    if (!redirectOrganizationSession) return;

    const destination = resolveSignInDestination({
      platformSession,
      requestedProductCodes,
      productAddresses: getProductApplicationAddresses(),
      recentlyOpenedProductCode: readRecentProductRedirect(),
    });
    if (destination.kind === "product") {
      setDestinationMessage(`Opening ${destination.productName}`);
      rememberProductRedirect(destination.productCode);
      window.location.replace(destination.address);
      return;
    }

    setDestinationMessage(
      destination.kind === "products"
        ? "Opening your products"
        : "Opening your organisation application"
    );
    router.replace(
      destination.kind === "products"
        ? ORGANIZATION_ROUTES.products
        : ORGANIZATION_ROUTES.onboarding
    );
  }, [
    hasPlatformRoles,
    isRestoring,
    platformSession,
    redirectOrganizationSession,
    requestedProductCodes,
    router,
  ]);

  const isRedirecting = Boolean(
    platformSession &&
    !isRestoring &&
    !redirectError &&
    (hasPlatformRoles || redirectOrganizationSession)
  );

  const redirectMessage = hasPlatformRoles
    ? "Opening the HealthAlyst staff workspace"
    : (destinationMessage ?? "Opening your organisation application");

  return { isRedirecting, redirectError, redirectMessage };
}
