import { z } from "zod";
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

const acceptedResponseSchema = z.object({
  status: z.literal("ACCEPTED"),
});

/**
 * `POST /v1/auth/verify-email/resend`. Always `202 ACCEPTED`, whether or not
 * an unconfirmed account uses the address, so the answer reveals nothing.
 */
export async function resendEmailVerification(
  emailAddress: string
): Promise<void> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/verify-email/resend",
      { email: emailAddress }
    );
    if (!acceptedResponseSchema.safeParse(response.data).success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not request a new confirmation link. Try again shortly."
    );
  }
}

const emailVerificationResponseSchema = z.object({
  verified: z.literal(true),
  enrolmentToken: z.string().optional(),
  expiresIn: z.number().int().optional(),
});

export type EmailVerificationResponse = z.infer<
  typeof emailVerificationResponseSchema
>;

/**
 * `POST /v1/auth/verify-email` with the token from the emailed link
 * (`/verify-email?token=…`). When the account has no authenticator yet, the
 * answer carries a short-lived `enrolmentToken` for setting one up. An
 * expired or already used link answers `410 TOKEN_EXPIRED`.
 */
export async function verifyPlatformEmailAddress(
  verificationToken: string
): Promise<EmailVerificationResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/verify-email",
      { token: verificationToken }
    );
    const verificationResponse = emailVerificationResponseSchema.safeParse(
      response.data
    );
    if (!verificationResponse.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return verificationResponse.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not confirm the email address. Try again shortly."
    );
  }
}
