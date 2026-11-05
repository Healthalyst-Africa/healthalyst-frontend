import { z } from "zod";
import { INTERNATIONAL_PHONE_PATTERN } from "~/shared/organization/config/organization-validation";
import { toInternationalPhoneNumber } from "~/shared/organization/utilities/international-phone-number";
import { TEAM_FIELD_LIMITS } from "~/features/team-management/config/team-management";
import {
  licenceBodySchema,
  licenceVerificationMethodSchema,
  specialtySchema,
} from "~/features/team-management/schemas/team-response-schemas";
import {
  isDateText,
  todayAsDateText,
} from "~/features/team-management/utilities/date-text";

// A checked box submits "on"; an unchecked one submits nothing.
const checkbox = z
  .string()
  .optional()
  .transform((value) => value === "on");

// Repeated form names arrive as an array; a single value or none does not.
const valueList = z.preprocess(
  (value) =>
    value === undefined || value === ""
      ? []
      : Array.isArray(value)
        ? value
        : [value],
  z.array(z.string())
);

function requiredName(label: string) {
  return z
    .string()
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(
      TEAM_FIELD_LIMITS.nameMaximumLength,
      `Use no more than ${TEAM_FIELD_LIMITS.nameMaximumLength} characters.`
    );
}

const jobTitle = z
  .string()
  .trim()
  .max(
    TEAM_FIELD_LIMITS.jobTitleMaximumLength,
    `Use no more than ${TEAM_FIELD_LIMITS.jobTitleMaximumLength} characters.`
  )
  .default("");

// Fields in a closed section and unchosen selects submit nothing at all.
const optionalSpecialty = z
  .string()
  .default("")
  .transform((value) => value || null)
  .pipe(specialtySchema.nullable());

const optionalDate = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isDateText(value),
    "Enter a date, for example 30/11/2026."
  )
  .default("");

const accessEndsOn = optionalDate.refine(
  (value) => value === "" || value >= todayAsDateText(),
  "Choose today or a later date."
);

const licenceFields = {
  licenceBody: z.string().default(""),
  licenceNumber: z
    .string()
    .trim()
    .max(
      TEAM_FIELD_LIMITS.licenceNumberMaximumLength,
      `Use no more than ${TEAM_FIELD_LIMITS.licenceNumberMaximumLength} characters.`
    )
    .default(""),
  licenceExpiresOn: optionalDate,
};

type LicenceValues = {
  licenceBody: string;
  licenceNumber: string;
  licenceExpiresOn: string;
};

/** A licence is all three fields or none of them. */
function checkLicence(values: LicenceValues, context: z.RefinementCtx) {
  const hasAnyField = Boolean(
    values.licenceBody || values.licenceNumber || values.licenceExpiresOn
  );
  if (!hasAnyField) return;
  if (!licenceBodySchema.safeParse(values.licenceBody).success) {
    context.addIssue({
      code: "custom",
      path: ["licenceBody"],
      message: "Choose the regulator that issued the licence.",
    });
  }
  if (!values.licenceNumber) {
    context.addIssue({
      code: "custom",
      path: ["licenceNumber"],
      message: "Enter the licence number.",
    });
  }
  if (!values.licenceExpiresOn) {
    context.addIssue({
      code: "custom",
      path: ["licenceExpiresOn"],
      message: "Enter the date the licence expires.",
    });
  }
}

function readLicence(values: LicenceValues) {
  const body = licenceBodySchema.safeParse(values.licenceBody);
  return body.success && values.licenceNumber && values.licenceExpiresOn
    ? {
        body: body.data,
        number: values.licenceNumber,
        expiresOn: values.licenceExpiresOn,
      }
    : undefined;
}

const accessScopeFields = {
  roleIds: valueList.pipe(
    z.array(z.string()).min(1, "Choose at least one role.")
  ),
  allBranches: checkbox,
  branchIds: valueList,
  departmentIds: valueList,
};

function checkBranchScope(
  values: { allBranches: boolean; branchIds: string[] },
  context: z.RefinementCtx
) {
  if (!values.allBranches && values.branchIds.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["branchIds"],
      message: "Choose the branches this person works at, or all branches.",
    });
  }
}

/** The single invitation form, mapped to `POST /v1/staff/invitations`. */
export const staffInvitationFormSchema = z
  .object({
    firstName: requiredName("first name"),
    lastName: requiredName("last name"),
    email: z
      .string()
      .trim()
      .max(TEAM_FIELD_LIMITS.emailMaximumLength)
      .refine(
        (value) => value === "" || z.email().safeParse(value).success,
        "Enter a valid email address."
      ),
    phone: z
      .string()
      .trim()
      .transform((value) => (value ? toInternationalPhoneNumber(value) : ""))
      .refine(
        (value) => value === "" || INTERNATIONAL_PHONE_PATTERN.test(value),
        "Enter a valid phone number, for example 08031234567."
      ),
    ...accessScopeFields,
    jobTitle,
    specialty: optionalSpecialty,
    ...licenceFields,
    accessEndsOn,
  })
  .superRefine((values, context) => {
    if (!values.email && !values.phone) {
      context.addIssue({
        code: "custom",
        path: ["email"],
        message: "Enter an email address or a phone number for the invitation.",
      });
    }
    checkBranchScope(values, context);
    checkLicence(values, context);
  })
  .transform((values) => ({
    firstName: values.firstName,
    lastName: values.lastName,
    ...(values.email && { email: values.email }),
    ...(values.phone && { phone: values.phone }),
    roleIds: values.roleIds,
    allBranches: values.allBranches,
    branchIds: values.allBranches ? [] : values.branchIds,
    departmentIds: values.departmentIds,
    ...(values.jobTitle && { jobTitle: values.jobTitle }),
    ...(values.specialty && { specialty: values.specialty }),
    ...(readLicence(values) && { licence: readLicence(values) }),
    ...(values.accessEndsOn && { accessEndsOn: values.accessEndsOn }),
  }));

/**
 * Naira as people type it, such as "50,000", stored as kobo. Empty means no
 * limit; a field the form did not show stays undefined, meaning unchanged.
 */
const optionalNairaAmount = z
  .string()
  .optional()
  .transform((value) => value?.trim().replace(/[,\s₦]/g, ""))
  .refine(
    (value) =>
      value === undefined || value === "" || /^\d+(\.\d{1,2})?$/.test(value),
    "Enter an amount in naira, for example 50,000."
  )
  .transform((value) =>
    value === undefined
      ? undefined
      : value === ""
        ? null
        : Math.round(Number.parseFloat(value) * 100)
  )
  .refine(
    (kobo) =>
      kobo === undefined ||
      kobo === null ||
      kobo <= TEAM_FIELD_LIMITS.approvalAmountMaximumKobo,
    "Enter no more than ₦10,000,000."
  );

/** Roles, branches, job details and limits for an existing member. */
export const memberAccessFormSchema = z
  .object({
    ...accessScopeFields,
    jobTitle: jobTitle.transform((value) => value || null),
    specialty: optionalSpecialty,
    accessEndsOn: accessEndsOn.transform((value) => value || null),
    waiverAmount: optionalNairaAmount,
    billToFolderAmount: optionalNairaAmount,
    discountPercent: z
      .string()
      .optional()
      .transform((value) => value?.trim())
      .refine(
        (value) =>
          value === undefined ||
          value === "" ||
          (/^\d+$/.test(value) &&
            Number(value) <= TEAM_FIELD_LIMITS.discountPercentMaximum),
        "Enter a whole percentage from 0 to 100."
      )
      .transform((value) =>
        value === undefined ? undefined : value === "" ? null : Number(value)
      ),
  })
  .superRefine(checkBranchScope);

export type MemberAccessFormValues = z.output<typeof memberAccessFormSchema>;

/** A member's practising licence. */
export const memberLicenceFormSchema = z
  .object(licenceFields)
  .superRefine((values, context) => {
    if (
      !values.licenceBody &&
      !values.licenceNumber &&
      !values.licenceExpiresOn
    ) {
      context.addIssue({
        code: "custom",
        path: ["licenceBody"],
        message: "Choose the regulator that issued the licence.",
      });
      return;
    }
    checkLicence(values, context);
  })
  .transform((values) => readLicence(values));

/** How a licence was confirmed with its regulator. */
export const licenceVerificationFormSchema = z.object({
  method: z
    .string()
    .default("")
    .refine(
      (value) => licenceVerificationMethodSchema.safeParse(value).success,
      "Choose how you confirmed the licence."
    )
    .transform((value) => licenceVerificationMethodSchema.parse(value)),
  reference: z
    .string()
    .trim()
    .max(
      TEAM_FIELD_LIMITS.verificationReferenceMaximumLength,
      `Use no more than ${TEAM_FIELD_LIMITS.verificationReferenceMaximumLength} characters.`
    )
    .transform((value) => value || undefined),
});

/** A custom role's name and permissions. */
export const teamRoleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter the role name.")
    .max(
      TEAM_FIELD_LIMITS.roleNameMaximumLength,
      `Use no more than ${TEAM_FIELD_LIMITS.roleNameMaximumLength} characters.`
    ),
  permissions: valueList.pipe(
    z.array(z.string()).min(1, "Choose at least one permission.")
  ),
});

/** Several people with the same roles and branches. */
export const bulkInvitationFormSchema = z
  .object({
    people: z.string().trim().min(1, "Add at least one person, one per line."),
    ...accessScopeFields,
  })
  .superRefine(checkBranchScope);
