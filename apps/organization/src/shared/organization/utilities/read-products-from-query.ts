import {
  ORGANIZATION_PRODUCTS,
  type OrganizationProductCode,
} from "~/shared/organization/config/organization-products";

/**
 * Products named in a link from a product app, such as
 * `?product=healthschedule` or `?product=labconnect,pharmadesk`. Registration
 * pre-selects them and sign-in returns to them. Unknown names are ignored.
 */
export function readProductsFromQuery(
  queryValue: string | readonly string[] | undefined
): OrganizationProductCode[] {
  const requestedNames = (
    typeof queryValue === "string" ? [queryValue] : (queryValue ?? [])
  )
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toUpperCase());

  return ORGANIZATION_PRODUCTS.map((product) => product.code).filter(
    (productCode) => requestedNames.includes(productCode)
  );
}
