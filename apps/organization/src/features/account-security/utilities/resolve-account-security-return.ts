import { ORGANIZATION_ROUTES } from "~/config/routes";
import {
  ORGANIZATION_PRODUCTS,
  type OrganizationProductCode,
} from "~/shared/organization/config/organization-products";

export type AccountSecurityReturn = {
  href: string;
  label: string;
  /** True for another HealthAlyst application, which needs a full page load. */
  isProductApplication: boolean;
};

/**
 * The page above account security in its breadcrumb trail. A product that linked here is
 * returned to only when the organisation is approved and the product's
 * address is configured, so the address never comes from the link itself.
 */
export function resolveAccountSecurityReturn({
  returnProductCode,
  isApproved,
  productAddresses,
}: {
  returnProductCode: OrganizationProductCode | undefined;
  isApproved: boolean;
  productAddresses: Partial<Record<OrganizationProductCode, string>>;
}): AccountSecurityReturn {
  const productAddress = returnProductCode
    ? productAddresses[returnProductCode]
    : undefined;
  const product = ORGANIZATION_PRODUCTS.find(
    (candidate) => candidate.code === returnProductCode
  );
  if (isApproved && productAddress && product) {
    return {
      href: productAddress,
      label: product.name,
      isProductApplication: true,
    };
  }
  return isApproved
    ? {
        href: ORGANIZATION_ROUTES.products,
        label: "Products",
        isProductApplication: false,
      }
    : {
        href: ORGANIZATION_ROUTES.onboarding,
        label: "Your application",
        isProductApplication: false,
      };
}
