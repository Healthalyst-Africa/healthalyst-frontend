import { z } from "zod";

export const sensitivityCategorySchema = z.enum([
  "HIV",
  "MENTAL_HEALTH",
  "SEXUAL_REPRODUCTIVE_HEALTH",
  "SUBSTANCE_USE",
  "RESTRICTED_PERSON",
]);

/**
 * Whether a record is restricted and what the reader may see. Without
 * access the labels are null: the category is itself sensitive.
 */
export const recordSensitivitySchema = z.object({
  restricted: z.boolean(),
  access: z.enum(["NOT_RESTRICTED", "CARE_TEAM", "BREAK_GLASS", "NONE"]),
  accessUntil: z.string().nullable(),
  labels: z
    .array(
      z.object({
        id: z.string(),
        category: sensitivityCategorySchema,
        reason: z.string(),
        createdById: z.string(),
        createdAt: z.string(),
      })
    )
    .nullable(),
});

const grantReviewSchema = z
  .object({
    outcome: z.enum(["JUSTIFIED", "NOT_JUSTIFIED"]),
    note: z.string(),
    reviewedById: z.string(),
    reviewedAt: z.string(),
  })
  .nullable();

export const emergencyAccessGrantSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  userId: z.string(),
  reason: z.string(),
  grantedAt: z.string(),
  expiresAt: z.string(),
  review: grantReviewSchema,
});

export const emergencyAccessGrantListSchema = z.object({
  data: z.array(
    emergencyAccessGrantSchema.extend({
      patient: z.object({
        patientNumber: z.string(),
        firstName: z.string(),
        lastName: z.string(),
      }),
    })
  ),
});

export type RecordSensitivity = z.infer<typeof recordSensitivitySchema>;
export type SensitivityLabel = NonNullable<RecordSensitivity["labels"]>[number];
export type SensitivityCategory = z.infer<typeof sensitivityCategorySchema>;
export type EmergencyAccessGrant = z.infer<typeof emergencyAccessGrantSchema>;
export type ReviewableGrant = z.infer<
  typeof emergencyAccessGrantListSchema
>["data"][number];
