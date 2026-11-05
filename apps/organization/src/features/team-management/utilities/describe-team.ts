import {
  PERMISSION_AREAS,
  TEAM_FIELD_LIMITS,
} from "~/features/team-management/config/team-management";
import type { MemberAccessFormValues } from "~/features/team-management/schemas/team-form-schemas";
import type {
  StaffInvitationRequest,
  StaffMember,
  StaffMemberChanges,
  TeamPermission,
} from "~/features/team-management/types/team-management";

type NamedPerson = { firstName: string; lastName: string };
type BranchScope = { allBranches: boolean; branchIds: readonly string[] };
type NamedRecord = { id: string; name: string };

export function describeFullName(person: NamedPerson): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function describeRoleNames(roles: readonly { name: string }[]): string {
  return roles.length > 0
    ? roles.map((role) => role.name).join(", ")
    : "No roles";
}

export function describeBranchScope(
  scope: BranchScope,
  branches: readonly NamedRecord[]
): string {
  if (scope.allBranches) return "All branches";
  const branchNames = scope.branchIds.map(
    (branchId) =>
      branches.find((branch) => branch.id === branchId)?.name ??
      "A branch you cannot see"
  );
  return branchNames.length > 0 ? branchNames.join(", ") : "No branches";
}

/** Kobo as naira for a form field, without a currency sign. */
export function koboToNairaText(kobo: number | null): string {
  if (kobo === null) return "";
  return (kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

export function formatNaira(kobo: number | null): string {
  if (kobo === null) return "No limit set";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

function haveSameValues(
  first: readonly string[],
  second: readonly string[]
): boolean {
  if (first.length !== second.length) return false;
  const secondValues = new Set(second);
  return first.every((value) => secondValues.has(value));
}

/**
 * Only the fields that differ from the saved member, so a save never sends
 * values the person did not change.
 */
export function readMemberChanges(
  member: StaffMember,
  values: MemberAccessFormValues
): StaffMemberChanges {
  const changes: StaffMemberChanges = {};
  const savedRoleIds = member.roles.map((role) => role.id);
  if (!haveSameValues(savedRoleIds, values.roleIds)) {
    changes.roleIds = values.roleIds;
  }
  if (values.allBranches !== member.allBranches) {
    changes.allBranches = values.allBranches;
  }
  const branchIds = values.allBranches ? [] : values.branchIds;
  if (!values.allBranches && !haveSameValues(member.branchIds, branchIds)) {
    changes.branchIds = branchIds;
  }
  if (!haveSameValues(member.departmentIds, values.departmentIds)) {
    changes.departmentIds = values.departmentIds;
  }
  if (values.jobTitle !== member.jobTitle) changes.jobTitle = values.jobTitle;
  if (values.specialty !== member.specialty) {
    changes.specialty = values.specialty;
  }
  if (values.accessEndsOn !== member.accessEndsOn) {
    changes.accessEndsOn = values.accessEndsOn;
  }

  // Undefined limits were not on the form, so they stay as saved.
  const limits = member.approvalLimits;
  const approvalLimits = {
    ...(values.waiverAmount !== undefined &&
      values.waiverAmount !== limits.waiverKobo && {
        waiverKobo: values.waiverAmount,
      }),
    ...(values.billToFolderAmount !== undefined &&
      values.billToFolderAmount !== limits.billToFolderKobo && {
        billToFolderKobo: values.billToFolderAmount,
      }),
    ...(values.discountPercent !== undefined &&
      values.discountPercent !== limits.discountPercent && {
        discountPercent: values.discountPercent,
      }),
  };
  if (Object.keys(approvalLimits).length > 0) {
    changes.approvalLimits = approvalLimits;
  }
  return changes;
}

/** The signed-in person's own membership, which the API does not let them change. */
export function isOwnMembership(
  member: StaffMember,
  currentUserId: string
): boolean {
  return member.userId === currentUserId;
}

export type PermissionArea = {
  key: string;
  label: string;
  permissions: TeamPermission[];
};

/** The catalogue in the editor's order, one group per area. */
export function groupPermissionsByArea(
  catalogue: readonly TeamPermission[]
): PermissionArea[] {
  const knownPrefixes = new Set<string>(
    PERMISSION_AREAS.map((area) => area.prefix)
  );
  const areas: PermissionArea[] = PERMISSION_AREAS.map((area) => ({
    key: area.prefix,
    label: area.label,
    permissions: catalogue.filter(
      (permission) => permission.code.split(":")[0] === area.prefix
    ),
  }));
  const otherPermissions = catalogue.filter(
    (permission) => !knownPrefixes.has(permission.code.split(":")[0] ?? "")
  );
  if (otherPermissions.length > 0) {
    areas.push({ key: "other", label: "Other", permissions: otherPermissions });
  }
  return areas.filter((area) => area.permissions.length > 0);
}

type SharedInvitationScope = Pick<
  StaffInvitationRequest,
  "roleIds" | "allBranches" | "branchIds" | "departmentIds"
>;

export type BulkInvitationRows =
  | { success: true; invitations: StaffInvitationRequest[] }
  | { success: false; problems: string[] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reads "First name, Last name, Email or phone, Job title" lines, one person
 * per line. Every problem names its line so it can be fixed in place.
 */
export function readBulkInvitationRows(
  peopleText: string,
  scope: SharedInvitationScope,
  toPhoneNumber: (phoneNumber: string) => string,
  phonePattern: RegExp
): BulkInvitationRows {
  const lines = peopleText
    .split(/\r?\n/)
    .map((line, lineIndex) => ({
      text: line.trim(),
      lineNumber: lineIndex + 1,
    }))
    .filter((line) => line.text !== "");
  const problems: string[] = [];
  const invitations: StaffInvitationRequest[] = [];

  if (lines.length > TEAM_FIELD_LIMITS.bulkInvitationMaximum) {
    return {
      success: false,
      problems: [
        `Invite no more than ${TEAM_FIELD_LIMITS.bulkInvitationMaximum} people at a time. You added ${lines.length}.`,
      ],
    };
  }

  for (const line of lines) {
    const [firstName = "", lastName = "", contact = "", jobTitle = ""] =
      line.text.split(",").map((part) => part.trim());
    const lineLabel = `Line ${line.lineNumber}`;
    if (!firstName || !lastName) {
      problems.push(`${lineLabel}: add a first and last name.`);
      continue;
    }
    if (
      firstName.length > TEAM_FIELD_LIMITS.nameMaximumLength ||
      lastName.length > TEAM_FIELD_LIMITS.nameMaximumLength
    ) {
      problems.push(
        `${lineLabel}: names can have up to ${TEAM_FIELD_LIMITS.nameMaximumLength} characters.`
      );
      continue;
    }
    const isEmail = contact.includes("@");
    const phoneNumber = isEmail ? "" : toPhoneNumber(contact);
    if (
      isEmail ? !EMAIL_PATTERN.test(contact) : !phonePattern.test(phoneNumber)
    ) {
      problems.push(
        `${lineLabel}: add a valid email address or phone number for ${firstName}.`
      );
      continue;
    }
    invitations.push({
      firstName,
      lastName,
      ...(isEmail ? { email: contact } : { phone: phoneNumber }),
      ...scope,
      branchIds: scope.allBranches ? [] : scope.branchIds,
      ...(jobTitle && {
        jobTitle: jobTitle.slice(0, TEAM_FIELD_LIMITS.jobTitleMaximumLength),
      }),
    });
  }

  if (problems.length > 0) return { success: false, problems };
  if (invitations.length === 0) {
    return { success: false, problems: ["Add at least one person."] };
  }
  return { success: true, invitations };
}
