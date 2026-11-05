import { z as schemaLibrary } from "zod";
import {
  ORGANIZATION_LIFECYCLE_LIMITS,
  OWNER_RECOVERY,
} from "~/features/organization-oversight/config/organization-lifecycle";

export const lifecycleReasonSchema = schemaLibrary.object({
  reason: schemaLibrary
    .string()
    .trim()
    .min(
      ORGANIZATION_LIFECYCLE_LIMITS.reasonMinimumLength,
      `Give a reason of at least ${ORGANIZATION_LIFECYCLE_LIMITS.reasonMinimumLength} characters.`
    )
    .max(
      ORGANIZATION_LIFECYCLE_LIMITS.reasonMaximumLength,
      `Keep the reason to ${ORGANIZATION_LIFECYCLE_LIMITS.reasonMaximumLength} characters or fewer.`
    ),
});

export const internalNoteSchema = schemaLibrary.object({
  note: schemaLibrary
    .string()
    .trim()
    .min(1, "Write the note before saving it.")
    .max(
      ORGANIZATION_LIFECYCLE_LIMITS.noteMaximumLength,
      `Keep the note to ${ORGANIZATION_LIFECYCLE_LIMITS.noteMaximumLength} characters or fewer.`
    ),
});

export const ownerAssignmentFormSchema = schemaLibrary.object({
  userId: schemaLibrary.string().min(1, "Choose the member to make an owner."),
  reason: schemaLibrary
    .string()
    .trim()
    .min(
      OWNER_RECOVERY.reasonMinimumLength,
      `Describe how you verified the request in at least ${OWNER_RECOVERY.reasonMinimumLength} characters.`
    )
    .max(
      OWNER_RECOVERY.reasonMaximumLength,
      `Keep the reason to ${OWNER_RECOVERY.reasonMaximumLength} characters or fewer.`
    ),
  confirmed: schemaLibrary.literal(true, {
    error: "Confirm that you verified the request outside HealthAlyst.",
  }),
});
