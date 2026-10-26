import {
  ORGANIZATION_PRODUCTS,
  type OrganizationProductCode,
} from "~/shared/organization/config/organization-products";

const RECENT_PRODUCT_REDIRECT_STORAGE_KEY =
  "healthalyst-recent-product-redirect";

/** A return within this time means the product could not open the session. */
const RECENT_PRODUCT_REDIRECT_DURATION_MILLISECONDS = 60_000;

/**
 * Remembers, for this tab only, which product sign-in just opened. It holds a
 * product code and a time, never credentials. Storage may be unavailable, in
 * which case sign-in still works without the loop guard.
 */
export function rememberProductRedirect(
  productCode: OrganizationProductCode
): void {
  try {
    window.sessionStorage.setItem(
      RECENT_PRODUCT_REDIRECT_STORAGE_KEY,
      JSON.stringify({ productCode, openedAt: Date.now() })
    );
  } catch {
    // Without storage the guard is skipped.
  }
}

/** The product opened within the last minute, if the person is back already. */
export function readRecentProductRedirect(): OrganizationProductCode | null {
  try {
    const storedValue = window.sessionStorage.getItem(
      RECENT_PRODUCT_REDIRECT_STORAGE_KEY
    );
    if (!storedValue) return null;
    const parsedValue: unknown = JSON.parse(storedValue);
    if (
      typeof parsedValue !== "object" ||
      parsedValue === null ||
      !("productCode" in parsedValue) ||
      !("openedAt" in parsedValue) ||
      typeof parsedValue.openedAt !== "number" ||
      Date.now() - parsedValue.openedAt >
        RECENT_PRODUCT_REDIRECT_DURATION_MILLISECONDS
    ) {
      return null;
    }
    return (
      ORGANIZATION_PRODUCTS.find(
        (product) => product.code === parsedValue.productCode
      )?.code ?? null
    );
  } catch {
    return null;
  }
}
