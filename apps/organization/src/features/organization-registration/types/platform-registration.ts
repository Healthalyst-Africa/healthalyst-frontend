import type { z } from "zod";
import type {
  NigerianStateCode,
  OrganizationType,
} from "~/shared/organization/types/organization-reference";
import type { OrganizationProduct } from "~/features/organization-registration/types/organization-product";
import type {
  policyVersionsSchema,
  organizationTypeReferenceSchema,
  nigerianStatesResponseSchema,
  registrationResponseSchema,
} from "~/features/organization-registration/schemas/platform-registration-schema";

/** Registration details collected by the form, before policy versions are added. */
export type PlatformRegistrationDetails = {
  organization: {
    legalName: string;
    tradingName?: string;
    type: OrganizationType;
    email: string;
    phone: string;
    addressLine: string;
    city: string;
    stateCode: NigerianStateCode;
    lga?: string;
    cacNumber?: string;
    products: OrganizationProduct[];
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  };
};

/** Registration details plus the Turnstile token required by the Platform API. */
export type PlatformRegistrationSubmission = PlatformRegistrationDetails & {
  captchaToken: string;
};

/** `POST /v1/onboarding/registrations` body (`RegistrationBody`). */
export type PlatformRegistrationRequest = PlatformRegistrationSubmission & {
  policies: PolicyVersions;
};

export type PolicyVersions = z.infer<typeof policyVersionsSchema>;

export type PlatformOrganizationTypeReference = z.infer<
  typeof organizationTypeReferenceSchema
>;
export type PlatformNigerianState = z.infer<
  typeof nigerianStatesResponseSchema
>["data"][number];
export type PlatformRegistrationResponse = z.infer<
  typeof registrationResponseSchema
>;
