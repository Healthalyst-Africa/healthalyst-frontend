import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import {
  ORGANIZATION_PRODUCTS,
  type OrganizationProductCode,
} from "~/shared/organization/config/organization-products";
import { APPROVED_ORGANIZATION_STATUS } from "~/shared/organization/config/organization-status";
import { findActiveMembership } from "~/shared/organization/utilities/find-active-membership";

export type SignInDestination =
  | { kind: "super-admin" }
  | {
      kind: "product";
      productCode: OrganizationProductCode;
      productName: string;
      address: string;
    }
  | { kind: "products" }
  | { kind: "onboarding" };

type SignInDestinationOptions = {
  platformSession: PlatformSession;
  /** Products named by the product app that sent the person to sign in. */
  requestedProductCodes: readonly OrganizationProductCode[];
  /** Product apps with a configured address. */
  productAddresses: Partial<Record<OrganizationProductCode, string>>;
  /** A product the browser was just sent to, which sent the person back. */
  recentlyOpenedProductCode: OrganizationProductCode | null;
};

/**
 * Where a signed-in person goes from the organisation hub. Platform staff go to
 * Super Admin. Members of an approved organisation go to the product they came
 * from, or to their only product with an app; otherwise they choose on the
 * products page. Organisations that are not approved yet go to onboarding. This
 * only chooses a screen; the Platform API enforces approval and product access
 * on every request.
 */
export function resolveSignInDestination({
  platformSession,
  requestedProductCodes,
  productAddresses,
  recentlyOpenedProductCode,
}: SignInDestinationOptions): SignInDestination {
  if (platformSession.platformRoles.length > 0) return { kind: "super-admin" };

  const membership = findActiveMembership(platformSession);
  if (
    !membership ||
    membership.organization.status !== APPROVED_ORGANIZATION_STATUS
  ) {
    return { kind: "onboarding" };
  }

  // The session lists only products HealthAlyst has activated.
  const openableProducts = ORGANIZATION_PRODUCTS.flatMap((product) => {
    const address = productAddresses[product.code];
    return address && membership.products.includes(product.code)
      ? [{ productCode: product.code, productName: product.name, address }]
      : [];
  }).filter(
    // A product that could not open the session sent the person back here.
    (product) => product.productCode !== recentlyOpenedProductCode
  );

  const requestedProduct = openableProducts.find((product) =>
    requestedProductCodes.includes(product.productCode)
  );
  if (requestedProduct) return { kind: "product", ...requestedProduct };

  const [onlyProduct, ...otherProducts] = openableProducts;
  if (onlyProduct && otherProducts.length === 0) {
    return { kind: "product", ...onlyProduct };
  }

  return { kind: "products" };
}
