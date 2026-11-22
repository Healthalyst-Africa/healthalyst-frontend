import { z } from "zod";
import { APPOINTMENT_TEXT_LIMITS } from "~/features/appointments/config/appointments";

const reasonSchema = z
  .string()
  .trim()
  .min(
    APPOINTMENT_TEXT_LIMITS.reasonMinimum,
    `Give a reason of at least ${APPOINTMENT_TEXT_LIMITS.reasonMinimum} characters`
  )
  .max(
    APPOINTMENT_TEXT_LIMITS.reasonMaximum,
    `Use ${APPOINTMENT_TEXT_LIMITS.reasonMaximum} characters or fewer`
  );

export const cancelAppointmentFormSchema = z.object({
  cancelledBy: z.enum(["PATIENT", "FACILITY"], {
    error: "Choose who cancelled",
  }),
  reason: reasonSchema,
});

/** When a waiting patient could come, and anything staff should know. */
export const waitlistFormSchema = z
  .object({
    fromDate: z.string().min(1, "Choose the first day they could come"),
    toDate: z.string().min(1, "Choose the last day they could come"),
    timeOfDay: z.enum(["ANY", "MORNING", "AFTERNOON"]),
    resourceId: z.string(),
    notes: z
      .string()
      .trim()
      .max(
        APPOINTMENT_TEXT_LIMITS.notesMaximum,
        `Use ${APPOINTMENT_TEXT_LIMITS.notesMaximum} characters or fewer`
      ),
  })
  .refine(
    (values) =>
      !values.fromDate || !values.toDate || values.toDate >= values.fromDate,
    {
      path: ["toDate"],
      message: "The last day must be on or after the first day",
    }
  );

export type CancelAppointmentFormValues = z.input<
  typeof cancelAppointmentFormSchema
>;
export type WaitlistFormValues = z.input<typeof waitlistFormSchema>;
