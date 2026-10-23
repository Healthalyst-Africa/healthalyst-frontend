import { z } from "zod";
export {
  resendEmailVerification,
  verifyPlatformEmailAddress,
} from "@healthalyst/platform-api/authentication-service";
export type { EmailVerificationResponse } from "@healthalyst/platform-api/authentication-service";
import type {
  NigerianStateCode,
  OrganizationType,
  OrganizationProduct,
} from "~/features/organization-onboarding/model/organization-registration-options";
import { getPlatformHttpClient } from "./platform-http-client";
import { toPlatformApiError } from "./platform-api-error";

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

export type PolicyVersions = {
  terms: string;
  privacyNotice: string;
  dpa: string;
};

const policyVersionsSchema = z.object({
  terms: z.string().min(1),
  privacyNotice: z.string().min(1),
  dpa: z.string().min(1),
});

const documentTypeSchema = z.enum([
  "CAC_CERTIFICATE",
  "FACILITY_LICENCE",
  "MEDICAL_DIRECTOR_LICENCE",
  "MLSCN_LICENCE",
  "PCN_PREMISES_LICENCE",
  "NHIA_ACCREDITATION",
  "PROOF_OF_ADDRESS",
  "OTHER",
]);

const organizationTypeReferenceSchema = z.object({
  type: z.enum([
    "CLINIC",
    "HOSPITAL",
    "SPECIALIST_CLINIC",
    "DIAGNOSTIC_CENTRE",
    "LABORATORY",
    "IMAGING_CENTRE",
    "PHARMACY",
    "MULTI_BRANCH_GROUP",
  ]),
  required: z.array(documentTypeSchema),
  optional: z.array(documentTypeSchema),
});

const organizationTypesResponseSchema = z.object({
  data: z.array(organizationTypeReferenceSchema),
});

const nigerianStatesResponseSchema = z.object({
  data: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
    })
  ),
});

export type PlatformOrganizationTypeReference = z.infer<
  typeof organizationTypeReferenceSchema
>;
export type PlatformNigerianState = z.infer<
  typeof nigerianStatesResponseSchema
>["data"][number];

const registrationResponseSchema = z.object({
  status: z.literal("PENDING_EMAIL_VERIFICATION"),
  message: z.string(),
});

export type PlatformRegistrationResponse = z.infer<
  typeof registrationResponseSchema
>;

/** Request paths in validation errors, mapped to the form's field names. */
const REGISTRATION_FIELD_NAMES_BY_PATH = {
  "organization.legalName": "legalName",
  "organization.tradingName": "tradingName",
  "organization.type": "organizationType",
  "organization.email": "organizationEmailAddress",
  "organization.phone": "organizationPhoneNumber",
  "organization.addressLine": "addressLine",
  "organization.city": "city",
  "organization.stateCode": "stateCode",
  "organization.lga": "localGovernmentArea",
  "organization.cacNumber": "corporateAffairsCommissionNumber",
  "organization.products": "products",
  "admin.firstName": "firstName",
  "admin.lastName": "lastName",
  "admin.email": "emailAddress",
  "admin.phone": "administratorPhoneNumber",
  "admin.password": "password",
  policies: "policiesAccepted",
} as const;

const UNEXPECTED_RESPONSE_MESSAGE =
  "We received an unexpected response from HealthAlyst. Contact HealthAlyst for help.";

/** `GET /v1/reference/policies`: the policy versions a registration must accept. */
export async function getPolicyVersions(): Promise<PolicyVersions> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      "/v1/reference/policies"
    );
    const policyVersions = policyVersionsSchema.safeParse(response.data);
    if (!policyVersions.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return policyVersions.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the current terms and policies. Try again shortly."
    );
  }
}

/** `GET /v1/reference/organization-types` for onboarding document rules. */
export async function getPlatformOrganizationTypes(): Promise<
  PlatformOrganizationTypeReference[]
> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      "/v1/reference/organization-types"
    );
    const organizationTypes = organizationTypesResponseSchema.safeParse(
      response.data
    );
    if (!organizationTypes.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return organizationTypes.data.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the organisation types. Try again shortly."
    );
  }
}

/** `GET /v1/reference/states` for current Nigerian state codes and names. */
export async function getPlatformNigerianStates(): Promise<
  PlatformNigerianState[]
> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      "/v1/reference/states"
    );
    const states = nigerianStatesResponseSchema.safeParse(response.data);
    if (!states.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return states.data.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the list of Nigerian states. Try again shortly."
    );
  }
}

/**
 * Registers an organisation and its administrator with the Platform API. It
 * reads the current policy versions first, because the registration must name
 * the versions the administrator accepted.
 *
 * The API always answers `202 PENDING_EMAIL_VERIFICATION` and never reveals
 * whether an account already exists.
 */
export async function registerOrganizationOnPlatform(
  registrationSubmission: PlatformRegistrationSubmission
): Promise<PlatformRegistrationResponse> {
  const policies = await getPolicyVersions();
  const registrationRequest: PlatformRegistrationRequest = {
    ...registrationSubmission,
    policies,
  };

  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/onboarding/registrations",
      registrationRequest
    );
    const registrationResponse = registrationResponseSchema.safeParse(
      response.data
    );
    if (!registrationResponse.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return registrationResponse.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not submit the application. Try again shortly.",
      REGISTRATION_FIELD_NAMES_BY_PATH
    );
  }
}
