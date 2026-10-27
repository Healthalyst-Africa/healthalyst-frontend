import { ORGANIZATION_PRODUCTS } from "~/shared/organization/config/organization-products";

export const productOptions = ORGANIZATION_PRODUCTS.map((product) => ({
  value: product.code,
  label: product.name,
  description: product.description,
}));
