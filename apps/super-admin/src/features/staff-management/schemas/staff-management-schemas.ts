import { z as schemaLibrary } from "zod";
import {
  GRANTABLE_PLATFORM_ROLES,
  PLATFORM_ROLES,
  PLATFORM_STAFF_STATUSES,
  STAFF_MANAGEMENT_LIMITS,
} from "~/features/staff-management/config/staff-management";

export const platformStaffMemberSchema = schemaLibrary.object({
  id: schemaLibrary.uuid(),
  email: schemaLibrary.string().nullable(),
  firstName: schemaLibrary.string(),
  lastName: schemaLibrary.string(),
  status: schemaLibrary.enum(PLATFORM_STAFF_STATUSES),
  roles: schemaLibrary.array(schemaLibrary.enum(PLATFORM_ROLES)),
  mfaEnrolled: schemaLibrary.boolean(),
  lastLoginAt: schemaLibrary.iso.datetime({ offset: true }).nullable(),
  createdAt: schemaLibrary.iso.datetime({ offset: true }),
});

export const platformStaffListSchema = schemaLibrary.object({
  data: schemaLibrary.array(platformStaffMemberSchema),
});

export const removedPlatformStaffMemberSchema =
  platformStaffMemberSchema.extend({
    /** Applications they had claimed for review, now back in the review queue. */
    releasedApplications: schemaLibrary.array(schemaLibrary.uuid()),
  });

export const addedPlatformStaffMemberSchema = platformStaffMemberSchema.extend({
  newAccount: schemaLibrary.boolean(),
});

const grantableRolesSchema = schemaLibrary
  .array(schemaLibrary.enum(GRANTABLE_PLATFORM_ROLES))
  .max(GRANTABLE_PLATFORM_ROLES.length);

function requiredName(fieldLabel: string) {
  return schemaLibrary
    .string()
    .trim()
    .min(1, `Enter the ${fieldLabel}.`)
    .max(
      STAFF_MANAGEMENT_LIMITS.nameMaximumLength,
      `Keep the ${fieldLabel} to ${STAFF_MANAGEMENT_LIMITS.nameMaximumLength} characters or fewer.`
    );
}

export const addPlatformStaffFormSchema = schemaLibrary.object({
  firstName: requiredName("first name"),
  lastName: requiredName("last name"),
  email: schemaLibrary
    .string()
    .trim()
    .max(
      STAFF_MANAGEMENT_LIMITS.emailMaximumLength,
      `Keep the email address to ${STAFF_MANAGEMENT_LIMITS.emailMaximumLength} characters or fewer.`
    )
    .pipe(schemaLibrary.email("Enter a valid email address.")),
  roles: grantableRolesSchema.min(1, "Choose at least one role."),
});

export const platformStaffRolesFormSchema = schemaLibrary.object({
  roles: grantableRolesSchema,
});

const removalReasonSchema = schemaLibrary
  .string()
  .trim()
  .min(
    STAFF_MANAGEMENT_LIMITS.removalReasonMinimumLength,
    `Give a reason of at least ${STAFF_MANAGEMENT_LIMITS.removalReasonMinimumLength} characters.`
  )
  .max(
    STAFF_MANAGEMENT_LIMITS.removalReasonMaximumLength,
    `Keep the reason to ${STAFF_MANAGEMENT_LIMITS.removalReasonMaximumLength} characters or fewer.`
  );

export const removeSuperAdminFormSchema = schemaLibrary.object({
  reason: removalReasonSchema,
  deactivate: schemaLibrary.boolean(),
});

export const removePlatformStaffFormSchema = schemaLibrary.object({
  reason: removalReasonSchema,
});
