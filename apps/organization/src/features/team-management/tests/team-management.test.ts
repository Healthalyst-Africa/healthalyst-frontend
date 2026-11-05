import { describe, expect, it } from "vitest";
import {
  bulkInvitationFormSchema,
  memberAccessFormSchema,
  memberLicenceFormSchema,
  staffInvitationFormSchema,
} from "~/features/team-management/schemas/team-form-schemas";
import type { StaffMember } from "~/features/team-management/types/team-management";
import {
  formatDateText,
  isDateText,
  todayAsDateText,
} from "~/features/team-management/utilities/date-text";
import {
  describeBranchScope,
  groupPermissionsByArea,
  koboToNairaText,
  readBulkInvitationRows,
  readMemberChanges,
} from "~/features/team-management/utilities/describe-team";
import { INTERNATIONAL_PHONE_PATTERN } from "~/shared/organization/config/organization-validation";
import { toInternationalPhoneNumber } from "~/shared/organization/utilities/international-phone-number";

const ROLE_IDENTIFIER = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const OTHER_ROLE_IDENTIFIER = "7a2d3c4b-5e6f-4a71-8b8c-0d1e2f3a4b5c";
const BRANCH_IDENTIFIER = "8b3e4d5c-6f7a-4b82-9c9d-1e2f3a4b5c6d";

const SAVED_MEMBER: StaffMember = {
  membershipId: "9c4f5e6d-7a8b-4c93-8dae-2f3a4b5c6d7e",
  userId: "0d5a6f7e-8b9c-4da4-9ebf-3a4b5c6d7e8f",
  firstName: "Amaka",
  lastName: "Obi",
  email: "amaka.obi@example.test",
  phone: null,
  status: "ACTIVE",
  roles: [{ id: ROLE_IDENTIFIER, code: "NURSE", name: "Nurse" }],
  allBranches: true,
  branchIds: [],
  departmentIds: [],
  jobTitle: "Nurse",
  specialty: "NURSING",
  accessEndsOn: null,
  licence: null,
  licenceStatus: "MISSING",
  approvalLimits: {
    waiverKobo: 500_000,
    billToFolderKobo: null,
    discountPercent: 10,
  },
  lastLoginAt: null,
  createdAt: "2026-11-01T09:00:00.000Z",
};

function parseAccessForm(values: Record<string, string | string[]>) {
  const result = memberAccessFormSchema.safeParse({
    roleIds: ROLE_IDENTIFIER,
    allBranches: "on",
    jobTitle: "Nurse",
    specialty: "NURSING",
    accessEndsOn: "",
    ...values,
  });
  if (!result.success) throw new Error(result.error.issues[0]?.message);
  return result.data;
}

describe("member changes", () => {
  it("sends nothing when the form matches the saved member", () => {
    expect(readMemberChanges(SAVED_MEMBER, parseAccessForm({}))).toEqual({});
  });

  it("sends only the fields that changed", () => {
    const changes = readMemberChanges(
      SAVED_MEMBER,
      parseAccessForm({
        roleIds: [ROLE_IDENTIFIER, OTHER_ROLE_IDENTIFIER],
        jobTitle: "",
      })
    );
    expect(changes).toEqual({
      roleIds: [ROLE_IDENTIFIER, OTHER_ROLE_IDENTIFIER],
      jobTitle: null,
    });
  });

  it("keeps approval limits that were not on the form", () => {
    // A closed section submits no limit fields at all.
    expect(
      readMemberChanges(SAVED_MEMBER, parseAccessForm({}))
    ).not.toHaveProperty("approvalLimits");
  });

  it("turns naira into kobo and empty limits into no limit", () => {
    const changes = readMemberChanges(
      SAVED_MEMBER,
      parseAccessForm({
        waiverAmount: "7,500",
        billToFolderAmount: "",
        discountPercent: "",
      })
    );
    expect(changes.approvalLimits).toEqual({
      waiverKobo: 750_000,
      discountPercent: null,
    });
  });

  it("asks for branches when the person does not work at every branch", () => {
    const result = memberAccessFormSchema.safeParse({
      roleIds: ROLE_IDENTIFIER,
      jobTitle: "",
      specialty: "",
      accessEndsOn: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["branchIds"]);
  });

  it("narrows to chosen branches and clears them for every branch", () => {
    const changes = readMemberChanges(
      SAVED_MEMBER,
      parseAccessForm({ allBranches: "", branchIds: BRANCH_IDENTIFIER })
    );
    expect(changes).toEqual({
      allBranches: false,
      branchIds: [BRANCH_IDENTIFIER],
    });
  });
});

describe("single invitation form", () => {
  const validInvitation = {
    firstName: " Tunde ",
    lastName: "Bello",
    email: "",
    phone: "0803 123 4567",
    roleIds: ROLE_IDENTIFIER,
    allBranches: "on",
  };

  it("builds the API request from what was entered", () => {
    const result = staffInvitationFormSchema.safeParse(validInvitation);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      firstName: "Tunde",
      lastName: "Bello",
      phone: "+2348031234567",
      roleIds: [ROLE_IDENTIFIER],
      allBranches: true,
      branchIds: [],
      departmentIds: [],
    });
  });

  it("needs an email address or a phone number", () => {
    const result = staffInvitationFormSchema.safeParse({
      ...validInvitation,
      phone: "",
    });
    expect(result.error?.issues[0]?.path).toEqual(["email"]);
  });

  it("needs at least one role", () => {
    const result = staffInvitationFormSchema.safeParse({
      ...validInvitation,
      roleIds: "",
    });
    expect(result.error?.issues[0]?.path).toEqual(["roleIds"]);
  });

  it("takes a licence only when all its parts are given", () => {
    const partialLicence = staffInvitationFormSchema.safeParse({
      ...validInvitation,
      licenceBody: "MDCN",
    });
    expect(partialLicence.success).toBe(false);
    expect(partialLicence.error?.issues.map((issue) => issue.path[0])).toEqual([
      "licenceNumber",
      "licenceExpiresOn",
    ]);

    const completeLicence = staffInvitationFormSchema.safeParse({
      ...validInvitation,
      licenceBody: "MDCN",
      licenceNumber: "MDCN/12345",
      licenceExpiresOn: "2030-01-31",
    });
    expect(completeLicence.data?.licence).toEqual({
      body: "MDCN",
      number: "MDCN/12345",
      expiresOn: "2030-01-31",
    });
  });

  it("refuses a locum end date in the past", () => {
    const result = staffInvitationFormSchema.safeParse({
      ...validInvitation,
      accessEndsOn: "2020-01-01",
    });
    expect(result.error?.issues[0]?.path).toEqual(["accessEndsOn"]);
  });
});

describe("licence form", () => {
  it("asks for the regulator when nothing is entered", () => {
    const result = memberLicenceFormSchema.safeParse({});
    expect(result.error?.issues[0]?.path).toEqual(["licenceBody"]);
  });
});

describe("bulk invitations", () => {
  const scope = {
    roleIds: [ROLE_IDENTIFIER],
    allBranches: true,
    branchIds: [],
    departmentIds: [],
  };

  function readRows(peopleText: string) {
    return readBulkInvitationRows(
      peopleText,
      scope,
      toInternationalPhoneNumber,
      INTERNATIONAL_PHONE_PATTERN
    );
  }

  it("reads one person per line, by email or phone", () => {
    const rows = readRows(
      "Amaka, Obi, amaka.obi@example.test, Nurse\n\nTunde, Bello, 0803 123 4567"
    );
    expect(rows).toEqual({
      success: true,
      invitations: [
        {
          firstName: "Amaka",
          lastName: "Obi",
          email: "amaka.obi@example.test",
          ...scope,
          jobTitle: "Nurse",
        },
        {
          firstName: "Tunde",
          lastName: "Bello",
          phone: "+2348031234567",
          ...scope,
        },
      ],
    });
  });

  it("names every line that needs fixing", () => {
    const rows = readRows(
      "Amaka, Obi, not-an-email\nTunde\nZainab, Musa, 0803"
    );
    expect(rows).toEqual({
      success: false,
      problems: [
        "Line 1: add a valid email address or phone number for Amaka.",
        "Line 2: add a first and last name.",
        "Line 3: add a valid email address or phone number for Zainab.",
      ],
    });
  });

  it("limits a batch to 200 people", () => {
    const rows = readRows(
      Array.from(
        { length: 201 },
        (_, lineIndex) =>
          `Person, Number${lineIndex}, person${lineIndex}@example.test`
      ).join("\n")
    );
    expect(rows.success).toBe(false);
  });

  it("asks for people before anything else", () => {
    const result = bulkInvitationFormSchema.safeParse({
      people: " ",
      roleIds: ROLE_IDENTIFIER,
      allBranches: "on",
    });
    expect(result.error?.issues[0]?.path).toEqual(["people"]);
  });
});

describe("presentation", () => {
  it("groups permissions by area in the editor's order", () => {
    const areas = groupPermissionsByArea([
      { code: "patient:read", description: "View patients" },
      { code: "staff:invite", description: "Invite staff" },
      { code: "future:thing", description: "Something new" },
    ]);
    expect(areas.map((area) => area.label)).toEqual([
      "Team",
      "Patients",
      "Other",
    ]);
  });

  it("describes branch scope by name", () => {
    const branches = [{ id: BRANCH_IDENTIFIER, name: "Ikeja" }];
    expect(
      describeBranchScope({ allBranches: true, branchIds: [] }, branches)
    ).toBe("All branches");
    expect(
      describeBranchScope(
        { allBranches: false, branchIds: [BRANCH_IDENTIFIER] },
        branches
      )
    ).toBe("Ikeja");
  });

  it("shows kobo as naira for editing", () => {
    expect(koboToNairaText(750_000)).toBe("7,500");
    expect(koboToNairaText(null)).toBe("");
  });

  it("reads and formats calendar dates", () => {
    expect(isDateText("2026-02-30")).toBe(false);
    expect(isDateText("2026-11-30")).toBe(true);
    expect(formatDateText("2026-11-30")).toBe("30 Nov 2026");
    expect(todayAsDateText(new Date(2026, 10, 5))).toBe("2026-11-05");
  });
});
