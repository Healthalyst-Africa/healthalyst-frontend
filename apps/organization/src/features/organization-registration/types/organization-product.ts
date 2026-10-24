import type { productOptions } from "~/features/organization-registration/config/organization-registration-options";

export type OrganizationProduct = (typeof productOptions)[number]["value"];
