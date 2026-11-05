import { describe, expect, it } from "vitest";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import type { PlatformOrganizationProfile } from "~/features/organization-management/types/organization-management";
import {
  branchCreationFormSchema,
  departmentCreationFormSchema,
  organizationProfileFormSchema,
} from "~/features/organization-settings/schemas/organization-settings-schemas";
import {
  describeBranchDepartments,
  describeBranchServices,
  sortBranches,
} from "~/features/organization-settings/utilities/describe-branches";
import {
  completeBranchCapabilities,
  isStaleVersionError,
  readProfileChanges,
} from "~/features/organization-settings/utilities/organization-settings-changes";

const SAVED_PROFILE: PlatformOrganizationProfile = {
  id: "0b8f7a6e-5d4c-4b3a-9f8e-7d6c5b4a3f2e",
  status: "ACTIVE",
  version: 4,
  entityTag: '"4"',
  legalName: "HealthAlyst Hospital Limited",
  tradingName: "HealthAlyst",
  type: "HOSPITAL",
  email: "front-desk@example.test",
  phone: "+2348031234567",
  addressLine: "11 Example Close",
  city: "Ikeja",
  stateCode: "LA",
  lga: "Ikeja",
  cacNumber: "RC5757",
  facilityLicenceNo: null,
  directoryListed: false,
};

const SAVED_FORM_VALUES = {
  tradingName: "HealthAlyst",
  email: "front-desk@example.test",
  phone: "08031234567",
  addressLine: "11 Example Close",
  city: "Ikeja",
  stateCode: "LA",
  lga: "Ikeja",
};

function parseProfileForm(values: Record<string, string>) {
  const result = organizationProfileFormSchema.safeParse(values);
  if (!result.success) throw new Error(result.error.issues[0]?.message);
  return result.data;
}

describe("readProfileChanges", () => {
  it("finds nothing to save when the form matches the saved profile", () => {
    expect(
      readProfileChanges(SAVED_PROFILE, parseProfileForm(SAVED_FORM_VALUES))
    ).toEqual({});
  });

  it("sends only the fields that changed", () => {
    expect(
      readProfileChanges(
        SAVED_PROFILE,
        parseProfileForm({
          ...SAVED_FORM_VALUES,
          city: "Lekki",
          directoryListed: "on",
        })
      )
    ).toEqual({ city: "Lekki", directoryListed: true });
  });

  it("clears the local government area when it is emptied", () => {
    expect(
      readProfileChanges(
        SAVED_PROFILE,
        parseProfileForm({ ...SAVED_FORM_VALUES, lga: "" })
      )
    ).toEqual({ lga: null });
  });
});

describe("isStaleVersionError", () => {
  it("recognises the API's version conflict", () => {
    expect(
      isStaleVersionError(
        new PlatformApiError("Changed", "VERSION_CONFLICT", null, 412, {}, null)
      )
    ).toBe(true);
  });

  it("ignores other failures", () => {
    expect(
      isStaleVersionError(
        new PlatformApiError("No", "VALIDATION_FAILED", null, 422, {}, null)
      )
    ).toBe(false);
    expect(isStaleVersionError(new Error("Network"))).toBe(false);
  });
});

describe("completeBranchCapabilities", () => {
  it("lists every service, keeping the saved choices", () => {
    const capabilities = completeBranchCapabilities([
      {
        category: "PHARMACY",
        isEnabled: true,
        acceptsExternalReferrals: true,
      },
    ]);
    expect(capabilities).toHaveLength(7);
    expect(
      capabilities.find((capability) => capability.category === "PHARMACY")
    ).toEqual({
      category: "PHARMACY",
      isEnabled: true,
      acceptsExternalReferrals: true,
    });
    expect(
      capabilities.find((capability) => capability.category === "SURGERY")
    ).toMatchObject({ isEnabled: false });
  });

  it("never takes referrals for a service the branch does not offer", () => {
    const [consultation] = completeBranchCapabilities([
      {
        category: "CONSULTATION",
        isEnabled: false,
        acceptsExternalReferrals: true,
      },
    ]);
    expect(consultation?.acceptsExternalReferrals).toBe(false);
  });
});

describe("branch and department forms", () => {
  it("lets the API make the branch short name when it is left empty", () => {
    expect(
      branchCreationFormSchema.parse({ name: "Lekki branch", slug: "" })
    ).toEqual({ name: "Lekki branch", slug: undefined });
  });

  it("accepts a lowercased short name and refuses spaces", () => {
    expect(
      branchCreationFormSchema.parse({ name: "Lekki", slug: "Lekki-Phase-1" })
        .slug
    ).toBe("lekki-phase-1");
    expect(
      branchCreationFormSchema.safeParse({ name: "Lekki", slug: "lekki 1" })
        .success
    ).toBe(false);
  });

  it("capitalises department codes and refuses ones that are too long", () => {
    expect(
      departmentCreationFormSchema.parse({ name: "Outpatients", code: "opd" })
        .code
    ).toBe("OPD");
    expect(
      departmentCreationFormSchema.safeParse({
        name: "Outpatients",
        code: "OUTPATIENTS-1",
      }).success
    ).toBe(false);
  });
});

describe("branch summaries", () => {
  const department = {
    id: "8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d",
    branchId: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    code: "OPD",
  };
  const branch = {
    id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    name: "Lekki",
    slug: "lekki",
    isActive: true,
    departments: [],
    capabilities: [],
  };

  it("lists offered services in the order people see them", () => {
    expect(
      describeBranchServices({
        ...branch,
        capabilities: [
          {
            category: "PHARMACY",
            isEnabled: true,
            acceptsExternalReferrals: false,
          },
          {
            category: "CONSULTATION",
            isEnabled: true,
            acceptsExternalReferrals: false,
          },
          {
            category: "SURGERY",
            isEnabled: false,
            acceptsExternalReferrals: false,
          },
        ],
      })
    ).toBe("Consultations, Pharmacy");
    expect(describeBranchServices(branch)).toBe("None chosen");
  });

  it("counts departments in use and inactive ones apart", () => {
    expect(describeBranchDepartments(branch)).toBe("None yet");
    expect(
      describeBranchDepartments({
        ...branch,
        departments: [
          { ...department, name: "Outpatients", isActive: true },
          { ...department, name: "Pharmacy", isActive: false },
        ],
      })
    ).toBe("1 department, 1 inactive");
    expect(
      describeBranchDepartments({
        ...branch,
        departments: [{ ...department, name: "Outpatients", isActive: false }],
      })
    ).toBe("1 inactive");
  });

  it("puts branches in use first, then by name", () => {
    expect(
      sortBranches([
        { ...branch, name: "Yaba", isActive: false },
        { ...branch, name: "Lekki" },
        { ...branch, name: "Ikeja" },
      ]).map((sortedBranch) => sortedBranch.name)
    ).toEqual(["Ikeja", "Lekki", "Yaba"]);
  });
});
