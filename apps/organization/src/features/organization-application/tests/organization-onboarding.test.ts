import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi as mockUtilities,
} from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { organizationOnboardingFormSchema } from "~/features/organization-application/schemas/organization-onboarding-form-schema";
import { updateOrganizationApplication } from "~/features/organization-application/services/organization-application-service";
import {
  getOrganizationOnboardingChanges,
  mergeOrganizationOnboardingDraft,
  toOrganizationOnboardingFormValues,
} from "~/features/organization-application/utilities/organization-onboarding-form";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";

function createProfile(): OrganizationApplication["profile"] {
  return {
    legalName: "Example Clinic Limited",
    tradingName: "Example Clinic",
    type: "CLINIC",
    email: "office@example.test",
    phone: "+2348031234567",
    addressLine: "12 Example Street",
    city: "Ikeja",
    stateCode: "LA",
    lga: null,
    cacNumber: "RC 6060",
    facilityLicenceNo: null,
  };
}

function createApplicationResponse() {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    status: "DRAFT",
    version: 8,
    canEdit: true,
    canSubmit: false,
    profile: createProfile(),
    checklist: {
      profileComplete: true,
      emailVerified: true,
      phoneVerified: false,
      mfaEnrolled: true,
      documentsComplete: false,
    },
    requiredDocuments: [],
    documents: [],
    messages: [],
    submittedAt: null,
  };
}

function createApiFailure(status: number, code: string, details: unknown = []) {
  return new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "Request failed",
    config: { headers: new AxiosHeaders() },
    headers: new AxiosHeaders(),
    data: {
      error: {
        code,
        message: "Check your organisation details.",
        requestId: "test-request",
        details,
      },
    },
  });
}

beforeAll(() => {
  mockUtilities.stubGlobal("window", new EventTarget());
  mockUtilities.stubEnv("NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL", "/");
});
afterEach(() => mockUtilities.restoreAllMocks());
afterAll(() => {
  mockUtilities.unstubAllGlobals();
  mockUtilities.unstubAllEnvs();
});

describe("organisation onboarding draft and API boundary", () => {
  it("normalizes contact and registration values to the backend contract", () => {
    const values = toOrganizationOnboardingFormValues(createProfile());
    expect(
      organizationOnboardingFormSchema.parse({
        ...values,
        phone: "0803 123 4567",
        cacNumber: "rc 6060",
        lga: "  ",
      })
    ).toMatchObject({
      phone: "+2348031234567",
      cacNumber: "RC6060",
      lga: null,
    });
  });

  it("sends only edited fields without silently normalizing untouched fields", () => {
    const profile = createProfile();
    const values = organizationOnboardingFormSchema.parse({
      ...toOrganizationOnboardingFormValues(profile),
      tradingName: "Example Care",
    });
    expect(
      getOrganizationOnboardingChanges(profile, values, ["tradingName"])
    ).toEqual({ tradingName: "Example Care" });
  });

  it("does not create a write for a phone formatting change", () => {
    const profile = createProfile();
    const values = organizationOnboardingFormSchema.parse({
      ...toOrganizationOnboardingFormValues(profile),
      phone: "08031234567",
    });
    expect(
      getOrganizationOnboardingChanges(profile, values, ["phone"])
    ).toBeNull();
  });

  it("retains a user's edits while adopting unrelated changes after a conflict", () => {
    const previous = toOrganizationOnboardingFormValues(createProfile());
    const latest = {
      ...previous,
      legalName: "Example Clinic Group",
      city: "Yaba",
    };
    const draft = { ...previous, tradingName: "Example Care" };
    expect(mergeOrganizationOnboardingDraft(latest, previous, draft)).toEqual({
      ...latest,
      tradingName: "Example Care",
    });
  });

  it("rejects invalid profile fields before sending the request", () => {
    const invalid = organizationOnboardingFormSchema.safeParse({
      ...toOrganizationOnboardingFormValues(createProfile()),
      email: "invalid",
      phone: "12",
      cacNumber: "invalid",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success)
      expect(invalid.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["email", "phone", "cacNumber"])
      );
  });

  it("preserves the draft ETag in If-Match and captures the next version", async () => {
    const request = mockUtilities
      .spyOn(getPlatformHttpClient(), "patch")
      .mockResolvedValueOnce({
        data: createApplicationResponse(),
        headers: { etag: '"8"' },
      });
    await expect(
      updateOrganizationApplication('"7"', { tradingName: "Example Care" })
    ).resolves.toMatchObject({ version: 8, entityTag: '"8"' });
    expect(request).toHaveBeenCalledExactlyOnceWith(
      "/v1/onboarding/application",
      { tradingName: "Example Care" },
      { headers: { "If-Match": '"7"' } }
    );
  });

  it("returns a version conflict without retrying the write", async () => {
    const request = mockUtilities
      .spyOn(getPlatformHttpClient(), "patch")
      .mockRejectedValueOnce(createApiFailure(409, "VERSION_CONFLICT"));
    await expect(
      updateOrganizationApplication('"7"', { tradingName: "Example Care" })
    ).rejects.toMatchObject({ status: 409, code: "VERSION_CONFLICT" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("maps server validation errors to the matching profile control", async () => {
    mockUtilities
      .spyOn(getPlatformHttpClient(), "patch")
      .mockRejectedValueOnce(
        createApiFailure(422, "VALIDATION_FAILED", [
          { path: ["cacNumber"], message: "Check the CAC number." },
        ])
      );
    await expect(
      updateOrganizationApplication('"7"', { cacNumber: "invalid" })
    ).rejects.toMatchObject({
      fieldErrors: { cacNumber: "Check the CAC number." },
    });
  });
});
