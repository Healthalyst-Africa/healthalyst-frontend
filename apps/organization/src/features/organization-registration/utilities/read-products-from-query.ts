import { productOptions } from "~/features/organization-registration/config/organization-registration-options";
import type { OrganizationProduct } from "~/features/organization-registration/types/organization-product";

/**
 * Products named in a link from a product app, such as
 * `?product=healthschedule` or `?product=labconnect,pharmadesk`, for
 * pre-selecting them in registration. Unknown names are ignored.
 */
export function readProductsFromQuery(
  queryValue: string | readonly string[] | undefined
): OrganizationProduct[] {
  const requestedNames = (
    typeof queryValue === "string" ? [queryValue] : (queryValue ?? [])
  )
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toUpperCase());

  return productOptions
    .map((option) => option.value)
    .filter((product) => requestedNames.includes(product));
}
