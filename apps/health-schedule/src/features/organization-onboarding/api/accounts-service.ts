import { isAxiosError } from "axios";
import type { ProductInterest } from "~/features/organization-onboarding/model/organization-interest-options";
import type { OrganizationType } from "~/features/organization-onboarding/model/organization-types";
import {
  AccountsApiConfigurationError,
  getAccountsHttpClient,
} from "./accounts-http-client";

export type RegistrationRequest = {
  organizationName: string;
  organizationType: OrganizationType;
  registrationNumber: string;
  organizationEmailAddress: string;
  organizationPhoneNumber: string | null;
  websiteUrl: string | null;
  productInterest: ProductInterest;
  countryCode: "NG";
  administratorName: string;
  emailAddress: string;
  password: string;
};

export type RegistrationResponse = {
  applicationId: string;
  status: "PENDING_REVIEW";
  emailVerificationRequired: true;
};

export type SessionRequest = {
  emailAddress: string;
  password: string;
  organizationId?: string;
};

export type SessionResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
};

export type OrganizationChoice = {
  organizationId: string;
  organizationName: string;
};

export type ApplicationStatus = {
  applicationId: string;
  organizationName: string;
  status: "PENDING_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "REJECTED";
  reviewNote?: string | null;
};

export type OrganizationRegistrationStatus = ApplicationStatus["status"];

export type EvidenceRequestStatus = "REQUESTED" | "SUBMITTED" | "ACCEPTED";

export type EvidenceDocument = {
  documentId: string;
  originalFilename: string;
  mediaType: "application/pdf" | "image/jpeg" | "image/png";
  sizeBytes: number;
  uploadedAt: string;
};

export type EvidenceRequest = {
  requestId: string;
  applicationId: string;
  title: string;
  instructions: string;
  status: EvidenceRequestStatus;
  reviewerNote: string | null;
  createdAt: string;
  documents: EvidenceDocument[];
};

const applicationStatuses = new Set<string>([
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRegistrationResponse(value: unknown): value is RegistrationResponse {
  return (
    isRecord(value) &&
    typeof value.applicationId === "string" &&
    value.status === "PENDING_REVIEW" &&
    value.emailVerificationRequired === true
  );
}

function isSessionResponse(value: unknown): value is SessionResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken === "string" &&
    value.tokenType === "Bearer" &&
    typeof value.expiresInSeconds === "number"
  );
}

function isOrganizationChoice(value: unknown): value is OrganizationChoice {
  return (
    isRecord(value) &&
    typeof value.organizationId === "string" &&
    typeof value.organizationName === "string"
  );
}

function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return (
    isRecord(value) &&
    typeof value.applicationId === "string" &&
    typeof value.organizationName === "string" &&
    typeof value.status === "string" &&
    applicationStatuses.has(value.status) &&
    (value.reviewNote === undefined ||
      value.reviewNote === null ||
      typeof value.reviewNote === "string")
  );
}

function isEvidenceDocument(value: unknown): value is EvidenceDocument {
  return (
    isRecord(value) &&
    typeof value.documentId === "string" &&
    typeof value.originalFilename === "string" &&
    (value.mediaType === "application/pdf" ||
      value.mediaType === "image/jpeg" ||
      value.mediaType === "image/png") &&
    typeof value.sizeBytes === "number" &&
    typeof value.uploadedAt === "string"
  );
}

function isEvidenceRequest(value: unknown): value is EvidenceRequest {
  return (
    isRecord(value) &&
    typeof value.requestId === "string" &&
    typeof value.applicationId === "string" &&
    typeof value.title === "string" &&
    typeof value.instructions === "string" &&
    (value.status === "REQUESTED" ||
      value.status === "SUBMITTED" ||
      value.status === "ACCEPTED") &&
    (value.reviewerNote == null || typeof value.reviewerNote === "string") &&
    typeof value.createdAt === "string" &&
    Array.isArray(value.documents) &&
    value.documents.every(isEvidenceDocument)
  );
}

function getResponseMessage(value: unknown): string | null {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : null;
}

function isOrganizationSelection(value: unknown): value is {
  organizations: OrganizationChoice[];
} {
  return (
    isRecord(value) &&
    Array.isArray(value.organizations) &&
    value.organizations.every(isOrganizationChoice)
  );
}

export class OrganizationSelectionRequiredError extends Error {
  constructor(
    readonly organizations: OrganizationChoice[],
    cause: unknown
  ) {
    super("Choose an organisation to continue.", { cause });
    this.name = "OrganizationSelectionRequiredError";
  }
}

export class AccountsAuthorizationError extends Error {
  constructor(cause: unknown) {
    super("Your session cannot access this application. Sign in again.", {
      cause,
    });
    this.name = "AccountsAuthorizationError";
  }
}

export class EmailVerificationRequiredError extends Error {
  constructor(cause: unknown) {
    super("Confirm your email address before signing in.", { cause });
    this.name = "EmailVerificationRequiredError";
  }
}

function isConnectionFailure(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

function getConnectionFailureMessage(error: unknown): string {
  if (
    isAxiosError(error) &&
    (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
  ) {
    return "HealthAlyst took too long to respond. Try again.";
  }

  return "We could not connect to HealthAlyst. Check your connection and try again.";
}

export async function registerOrganization(
  registrationRequest: RegistrationRequest
): Promise<RegistrationResponse> {
  try {
    const response = await getAccountsHttpClient().post<unknown>(
      "/api/v1/organization-registrations",
      registrationRequest
    );
    if (!isRegistrationResponse(response.data)) {
      throw new Error(
        "We received an unexpected response. Contact HealthAlyst for help."
      );
    }
    return response.data;
  } catch (error) {
    if (error instanceof AccountsApiConfigurationError) throw error;
    if (!isAxiosError(error)) throw error;
    if (error.response?.status === 409) {
      throw new Error(
        "An account or organisation with these details already exists. Sign in or contact support for help.",
        { cause: error }
      );
    }
    if (error.response?.status === 400) {
      throw new Error(
        getResponseMessage(error.response.data) ??
          "Check the details and correct the form fields.",
        { cause: error }
      );
    }
    throw new Error(
      isConnectionFailure(error)
        ? getConnectionFailureMessage(error)
        : "We could not submit the application. Try again shortly.",
      { cause: error }
    );
  }
}

export async function createSession(
  sessionRequest: SessionRequest
): Promise<SessionResponse> {
  try {
    const response = await getAccountsHttpClient().post<unknown>(
      "/api/v1/auth/session",
      sessionRequest
    );
    if (!isSessionResponse(response.data)) {
      throw new Error("We received an unexpected sign-in response. Try again.");
    }
    return response.data;
  } catch (error) {
    if (error instanceof AccountsApiConfigurationError) throw error;
    if (!isAxiosError(error)) throw error;
    if (
      error.response?.status === 409 &&
      isOrganizationSelection(error.response.data)
    ) {
      throw new OrganizationSelectionRequiredError(
        error.response.data.organizations,
        error
      );
    }
    if (error.response?.status === 401) {
      throw new Error("Email or password is incorrect.", { cause: error });
    }
    if (
      error.response?.status === 403 &&
      isRecord(error.response.data) &&
      error.response.data.code === "EMAIL_VERIFICATION_REQUIRED"
    ) {
      throw new EmailVerificationRequiredError(error);
    }
    throw new Error(
      isConnectionFailure(error)
        ? getConnectionFailureMessage(error)
        : "We could not sign you in. Try again shortly.",
      { cause: error }
    );
  }
}

export async function confirmEmailAddress(token: string): Promise<void> {
  try {
    await getAccountsHttpClient().post(
      "/api/v1/auth/email-verification/confirm",
      { token }
    );
  } catch (error) {
    if (error instanceof AccountsApiConfigurationError) throw error;
    if (!isAxiosError(error)) throw error;
    throw new Error(
      getResponseMessage(error.response?.data) ??
        (isConnectionFailure(error)
          ? getConnectionFailureMessage(error)
          : "This confirmation link is invalid or has expired. Request a new one."),
      { cause: error }
    );
  }
}

export async function resendEmailVerification(
  emailAddress: string
): Promise<void> {
  try {
    await getAccountsHttpClient().post(
      "/api/v1/auth/email-verification/resend",
      { emailAddress }
    );
  } catch (error) {
    if (error instanceof AccountsApiConfigurationError) throw error;
    if (!isAxiosError(error)) throw error;
    throw new Error(
      isConnectionFailure(error)
        ? getConnectionFailureMessage(error)
        : "We could not request another confirmation email. Try again shortly.",
      { cause: error }
    );
  }
}

export async function getMyApplication(
  session: SessionResponse
): Promise<ApplicationStatus> {
  try {
    const response = await getAccountsHttpClient().get<unknown>(
      "/api/v1/organization-registrations/mine",
      {
        headers: {
          Authorization: `${session.tokenType} ${session.accessToken}`,
        },
      }
    );
    if (!isApplicationStatus(response.data)) {
      throw new Error(
        "We received an unexpected application status. Try again."
      );
    }
    return response.data;
  } catch (error) {
    if (error instanceof AccountsApiConfigurationError) throw error;
    if (!isAxiosError(error)) throw error;
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new AccountsAuthorizationError(error);
    }
    throw new Error(
      isConnectionFailure(error)
        ? getConnectionFailureMessage(error)
        : "We could not load the organisation application. Try again.",
      { cause: error }
    );
  }
}

export async function getMyEvidenceRequests(
  session: SessionResponse
): Promise<EvidenceRequest[]> {
  return getEvidenceRequests(
    session,
    "/api/v1/organization-registrations/mine/evidence-requests"
  );
}

async function getEvidenceRequests(
  session: SessionResponse,
  endpoint: string
): Promise<EvidenceRequest[]> {
  try {
    const response = await getAccountsHttpClient().get<unknown>(endpoint, {
      headers: { Authorization: `${session.tokenType} ${session.accessToken}` },
    });
    if (
      !Array.isArray(response.data) ||
      !response.data.every(isEvidenceRequest)
    ) {
      throw new Error(
        "The evidence request service returned an unexpected response."
      );
    }
    return response.data;
  } catch (error) {
    if (error instanceof AccountsApiConfigurationError) throw error;
    if (!isAxiosError(error)) throw error;
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new AccountsAuthorizationError(error);
    }
    throw new Error(
      isConnectionFailure(error)
        ? getConnectionFailureMessage(error)
        : (getResponseMessage(error.response?.data) ??
            "We could not load evidence requests. Try again."),
      { cause: error }
    );
  }
}

export async function submitEvidenceDocument(
  session: SessionResponse,
  requestId: string,
  file: File
): Promise<EvidenceRequest> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await getAccountsHttpClient().post<unknown>(
      `/api/v1/organization-registrations/mine/evidence-requests/${requestId}/documents`,
      formData,
      {
        headers: {
          Authorization: `${session.tokenType} ${session.accessToken}`,
        },
      }
    );
    if (!isEvidenceRequest(response.data)) {
      throw new Error(
        "The evidence upload service returned an unexpected response."
      );
    }
    return response.data;
  } catch (error) {
    if (error instanceof AccountsApiConfigurationError) throw error;
    if (!isAxiosError(error)) throw error;
    throw new Error(
      getResponseMessage(error.response?.data) ??
        (isConnectionFailure(error)
          ? getConnectionFailureMessage(error)
          : "We could not upload this file. Check the file and try again."),
      { cause: error }
    );
  }
}
