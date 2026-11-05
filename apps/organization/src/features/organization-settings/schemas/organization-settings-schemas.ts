import { z } from "zod";
import { organizationOnboardingFormSchema } from "~/features/organization-application/schemas/organization-onboarding-form-schema";
import { BRANCH_FIELD_LIMITS } from "~/features/organization-settings/config/organization-settings";

/** The editable profile fields, checked by the same rules as onboarding. */
export const organizationProfileFormSchema = organizationOnboardingFormSchema
  .pick({
    tradingName: true,
    email: true,
    phone: true,
    addressLine: true,
    city: true,
    stateCode: true,
    lga: true,
  })
  .extend({
    // A checked box submits "on"; an unchecked one submits nothing.
    directoryListed: z
      .string()
      .optional()
      .transform((value) => value === "on"),
  });

const branchName = z
  .string()
  .trim()
  .min(1, "Enter the branch name.")
  .max(
    BRANCH_FIELD_LIMITS.nameMaximumLength,
    `Use no more than ${BRANCH_FIELD_LIMITS.nameMaximumLength} characters.`
  );

export const branchCreationFormSchema = z.object({
  name: branchName,
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(
      BRANCH_FIELD_LIMITS.slugMaximumLength,
      `Use no more than ${BRANCH_FIELD_LIMITS.slugMaximumLength} characters.`
    )
    .refine(
      (slug) => slug === "" || BRANCH_FIELD_LIMITS.slugPattern.test(slug),
      "Use lowercase letters and numbers, with single hyphens between words."
    )
    .transform((slug) => slug || undefined),
});

// A checked box submits "on"; an unchecked one submits nothing.
const isActiveCheckbox = z
  .string()
  .optional()
  .transform((value) => value === "on");

export const branchEditFormSchema = z.object({
  name: branchName,
  isActive: isActiveCheckbox,
});

const departmentName = z
  .string()
  .trim()
  .min(1, "Enter the department name.")
  .max(
    BRANCH_FIELD_LIMITS.nameMaximumLength,
    `Use no more than ${BRANCH_FIELD_LIMITS.nameMaximumLength} characters.`
  );

export const departmentCreationFormSchema = z.object({
  name: departmentName,
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Enter a short department code.")
    .regex(
      BRANCH_FIELD_LIMITS.departmentCodePattern,
      `Use up to ${BRANCH_FIELD_LIMITS.departmentCodeMaximumLength} capital letters, numbers or hyphens, for example OPD.`
    ),
});

export const departmentEditFormSchema = z.object({
  name: departmentName,
  isActive: isActiveCheckbox,
});
