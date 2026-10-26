import Image from "next/image";
import { LockedIcon, UpcomingIcon } from "@healthalyst/icons";
import type { LauncherApplication } from "@healthalyst/ui/components/application-launcher-grid";
import { getProductApplicationAddresses } from "~/config/application-addresses";
import {
  ORGANIZATION_PRODUCTS,
  type OrganizationProductCode,
} from "~/shared/organization/config/organization-products";

const PRODUCT_IMAGE_SOURCES: Record<OrganizationProductCode, string> = {
  HEALTHSCHEDULE: "/images/module-hospital.webp",
  LABCONNECT: "/images/module-laboratory.webp",
  PHARMADESK: "/images/module-pharmacy.webp",
};

/**
 * Every HealthAlyst product as a launcher card. Products open only when the
 * organisation is approved, HealthAlyst has activated them (the session lists
 * only those) and they have an app; the rest say why not.
 */
export function buildProductLauncherApplications({
  isApproved,
  enabledProductCodes,
}: {
  isApproved: boolean;
  enabledProductCodes: readonly string[];
}): LauncherApplication[] {
  const productAddresses = getProductApplicationAddresses();
  const enabledProducts = new Set(enabledProductCodes);

  return ORGANIZATION_PRODUCTS.map((product) => {
    const isEnabled = isApproved && enabledProducts.has(product.code);
    const href = isEnabled ? productAddresses[product.code] : undefined;
    return {
      key: product.code,
      name: product.name,
      description: product.description,
      image: (
        <Image
          src={PRODUCT_IMAGE_SOURCES[product.code]}
          alt=""
          fill
          sizes="(min-width: 640px) 240px, (min-width: 420px) 50vw, 100vw"
        />
      ),
      href,
      available: isEnabled,
      unavailableLabel: !isApproved
        ? "Pending approval"
        : !isEnabled
          ? "Not enabled"
          : href
            ? undefined
            : "Coming soon",
      unavailableIcon:
        isApproved && !isEnabled ? <LockedIcon /> : <UpcomingIcon />,
    };
  });
}
