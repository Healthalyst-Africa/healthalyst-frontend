import { z } from "zod";
import {
  ACCESS_LEVELS,
  PARTNER_FIELD_LIMITS,
  PARTNERSHIP_STATUSES,
  SERVICE_CATEGORIES,
} from "~/features/partner-network/config/partner-network";
import { organizationTypeOptions } from "~/shared/organization/config/organization-reference";
import { toInternationalPhoneNumber } from "~/shared/organization/utilities/international-phone-number";

const ORGANIZATION_TYPES = organizationTypeOptions.map(
  (option) => option.value
) as [
  (typeof organizationTypeOptions)[number]["value"],
  ...(typeof organizationTypeOptions)[number]["value"][],
];

const serviceCategorySchema = z.enum(SERVICE_CATEGORIES);
const organizationTypeSchema = z.enum(ORGANIZATION_TYPES);

// ---------- Responses ----------

export const partnershipSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["OUTGOING", "INCOMING"]),
  partner: z.object({
    id: z.uuid(),
    name: z.string(),
    type: z.string().nullable(),
    stateCode: z.string().nullable(),
  }),
  serviceCategory: serviceCategorySchema,
  status: z.enum(PARTNERSHIP_STATUSES),
  accessLevel: z.enum(ACCESS_LEVELS),
  isPreferred: z.boolean(),
  priority: z.number().int(),
  dsaVersion: z.string().nullable(),
  dsaAcceptedAt: z.iso.datetime({ offset: true }).nullable(),
  respondedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});

export const partnershipListSchema = z.object({
  data: z.array(partnershipSchema),
});

export const directoryEntrySchema = z.object({
  organizationId: z.uuid(),
  name: z.string(),
  type: z.string().nullable(),
  stateCode: z.string().nullable(),
  city: z.string().nullable(),
  categories: z.array(serviceCategorySchema),
});

export const directoryResponseSchema = z.object({
  data: z.array(directoryEntrySchema),
});

export const partnerInvitationSchema = z.object({
  id: z.uuid(),
  partnerName: z.string(),
  email: z.string(),
  partnerType: organizationTypeSchema,
  serviceCategory: serviceCategorySchema,
  accessLevel: z.enum(ACCESS_LEVELS),
  status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]),
  expiresAt: z.iso.datetime({ offset: true }),
  createdAt: z.iso.datetime({ offset: true }),
});

export const partnerInvitationListSchema = z.object({
  data: z.array(partnerInvitationSchema),
});

export const partnerInvitationPreviewSchema = z.object({
  invitedBy: z.object({
    name: z.string(),
    type: organizationTypeSchema.nullable(),
  }),
  partnerName: z.string(),
  email: z.string(),
  partnerType: organizationTypeSchema,
  serviceCategory: serviceCategorySchema,
  expiresAt: z.iso.datetime({ offset: true }),
});

// ---------- Forms ----------

const prioritySchema = z.coerce
  .number({ error: "Enter a number." })
  .int("Enter a whole number.")
  .min(
    PARTNER_FIELD_LIMITS.priorityMinimum,
    `Use a number from ${PARTNER_FIELD_LIMITS.priorityMinimum} to ${PARTNER_FIELD_LIMITS.priorityMaximum}.`
  )
  .max(
    PARTNER_FIELD_LIMITS.priorityMaximum,
    `Use a number from ${PARTNER_FIELD_LIMITS.priorityMinimum} to ${PARTNER_FIELD_LIMITS.priorityMaximum}.`
  );

const checkboxSchema = z
  .union([z.literal("on"), z.literal("")])
  .optional()
  .transform((value) => value === "on");

export const partnershipRequestFormSchema = z.object({
  serviceCategory: z.enum(SERVICE_CATEGORIES, {
    error: "Choose the service.",
  }),
  priority: prioritySchema,
  isPreferred: checkboxSchema,
});

export const partnershipPreferenceFormSchema = z.object({
  priority: prioritySchema,
  isPreferred: checkboxSchema,
});

export const partnershipReasonFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(
      PARTNER_FIELD_LIMITS.reasonMaximumLength,
      `Keep the reason to ${PARTNER_FIELD_LIMITS.reasonMaximumLength} characters or fewer.`
    )
    .transform((reason) => reason || undefined),
});

export const partnershipAcceptanceFormSchema = z.object({
  agreementAccepted: z.literal("on", {
    error: "Confirm that you accept the data-sharing agreement.",
  }),
});

export const partnerInvitationFormSchema = z.object({
  partnerName: z
    .string()
    .trim()
    .min(
      PARTNER_FIELD_LIMITS.partnerNameMinimumLength,
      "Enter the organisation's name."
    )
    .max(
      PARTNER_FIELD_LIMITS.partnerNameMaximumLength,
      `Keep the name to ${PARTNER_FIELD_LIMITS.partnerNameMaximumLength} characters or fewer.`
    ),
  email: z
    .string()
    .trim()
    .max(
      PARTNER_FIELD_LIMITS.emailMaximumLength,
      `Keep the email address to ${PARTNER_FIELD_LIMITS.emailMaximumLength} characters or fewer.`
    )
    .pipe(z.email("Enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .transform(toInternationalPhoneNumber)
    .refine(
      (phone) => phone === "" || /^\+[1-9]\d{7,14}$/.test(phone),
      "Enter a phone number such as 0803 123 4567, or leave it empty."
    )
    .transform((phone) => phone || undefined),
  partnerType: z.enum(ORGANIZATION_TYPES, {
    error: "Choose the type of organisation.",
  }),
  serviceCategory: z.enum(SERVICE_CATEGORIES, {
    error: "Choose the service.",
  }),
  accessLevel: z.enum(["L0_CONTACT", "L1_PORTAL_LITE"]),
});
