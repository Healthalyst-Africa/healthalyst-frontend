import { z } from "zod";
import {
  BRANCH_TIME_OFF_KINDS,
  CALENDAR_TIME_OFF_KINDS,
  SCHEDULE_FIELD_LIMITS as LIMITS,
} from "~/features/schedule-setup/config/schedule-setup";

function wholeNumberText({
  label,
  minimum,
  maximum,
  optional = false,
}: {
  label: string;
  minimum: number;
  maximum: number;
  optional?: boolean;
}) {
  return z
    .string()
    .trim()
    .refine(
      (text) =>
        (optional && text === "") ||
        (/^\d+$/.test(text) &&
          Number(text) >= minimum &&
          Number(text) <= maximum),
      `${label} must be a whole number from ${minimum} to ${maximum}.`
    );
}

export const createCalendarFormSchema = z
  .object({
    kind: z.enum(["PRACTITIONER", "ROOM", "EQUIPMENT"]),
    memberId: z.string(),
    branchId: z.string(),
    name: z
      .string()
      .trim()
      .max(
        LIMITS.nameMaximum,
        `Use ${LIMITS.nameMaximum} characters or fewer.`
      ),
  })
  .superRefine((values, context) => {
    if (values.kind === "PRACTITIONER") {
      if (!values.memberId) {
        context.addIssue({
          code: "custom",
          path: ["memberId"],
          message: "Choose the staff member.",
        });
      }
      return;
    }
    if (!values.name) {
      context.addIssue({
        code: "custom",
        path: ["name"],
        message: "Enter a name, such as Consulting room 2.",
      });
    }
    if (!values.branchId) {
      context.addIssue({
        code: "custom",
        path: ["branchId"],
        message: "Choose the branch it belongs to.",
      });
    }
  });

export const renameCalendarFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(LIMITS.nameMaximum, `Use ${LIMITS.nameMaximum} characters or fewer.`),
});

const timeOffKindValueSchema = z.enum(["LEAVE", "BREAK", "HOLIDAY", "BLOCK"]);

export const timeOffFormSchema = z
  .object({
    appliesTo: z.enum(["calendar", "branch"]),
    calendarId: z.string(),
    branchId: z.string(),
    kind: timeOffKindValueSchema,
    allDay: z.boolean(),
    startDate: z.string().min(1, "Choose the first day."),
    startTime: z.string(),
    endDate: z.string().min(1, "Choose the last day."),
    endTime: z.string(),
    reason: z
      .string()
      .trim()
      .max(
        LIMITS.reasonMaximum,
        `Use ${LIMITS.reasonMaximum} characters or fewer.`
      ),
  })
  .superRefine((values, context) => {
    const allowedKinds: readonly string[] =
      values.appliesTo === "calendar"
        ? CALENDAR_TIME_OFF_KINDS
        : BRANCH_TIME_OFF_KINDS;
    if (!allowedKinds.includes(values.kind)) {
      context.addIssue({
        code: "custom",
        path: ["kind"],
        message:
          values.appliesTo === "calendar"
            ? "A calendar can have leave, a break or blocked time."
            : "A whole branch can have a public holiday or blocked time.",
      });
    }
    if (values.appliesTo === "calendar" && !values.calendarId) {
      context.addIssue({
        code: "custom",
        path: ["calendarId"],
        message: "Choose the calendar.",
      });
    }
    if (values.appliesTo === "branch" && !values.branchId) {
      context.addIssue({
        code: "custom",
        path: ["branchId"],
        message: "Choose the branch.",
      });
    }
    if (!values.allDay) {
      if (!values.startTime) {
        context.addIssue({
          code: "custom",
          path: ["startTime"],
          message: "Enter the start time.",
        });
      }
      if (!values.endTime) {
        context.addIssue({
          code: "custom",
          path: ["endTime"],
          message: "Enter the end time.",
        });
      }
    }
    if (!values.startDate || !values.endDate) return;
    const startsAt = `${values.startDate}T${values.allDay ? "00:00" : values.startTime}`;
    const endsAt = `${values.endDate}T${values.allDay ? "23:59" : values.endTime}`;
    if (endsAt <= startsAt) {
      context.addIssue({
        code: "custom",
        path: [
          values.allDay || values.endDate < values.startDate
            ? "endDate"
            : "endTime",
        ],
        message: "End after the start.",
      });
    }
  });

export const appointmentTypeFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name, such as General consultation.")
    .max(LIMITS.nameMaximum, `Use ${LIMITS.nameMaximum} characters or fewer.`),
  durationMinutes: wholeNumberText({
    label: "Length",
    minimum: LIMITS.durationMinimumMinutes,
    maximum: LIMITS.durationMaximumMinutes,
  }),
  newPatientDurationMinutes: wholeNumberText({
    label: "Length for new patients",
    minimum: LIMITS.durationMinimumMinutes,
    maximum: LIMITS.durationMaximumMinutes,
    optional: true,
  }),
  bufferMinutes: wholeNumberText({
    label: "Gap after each appointment",
    minimum: 0,
    maximum: LIMITS.bufferMaximumMinutes,
  }),
  priceNaira: z
    .string()
    .trim()
    .refine(
      (text) =>
        text === "" || /^\d+(\.\d{1,2})?$/.test(text.replaceAll(",", "")),
      "Enter the price in naira, such as 15000 or 15000.50."
    ),
  modality: z.enum(["IN_PERSON", "VIDEO", "AUDIO", "HOME"]),
  capacity: wholeNumberText({
    label: "Patients per appointment",
    minimum: 1,
    maximum: LIMITS.capacityMaximum,
  }),
  minimumNoticeHours: wholeNumberText({
    label: "Minimum notice",
    minimum: 0,
    maximum: LIMITS.minimumNoticeMaximumHours,
  }),
  advanceBookingDays: wholeNumberText({
    label: "How far ahead",
    minimum: 1,
    maximum: LIMITS.advanceBookingMaximumDays,
  }),
  dailyLimit: wholeNumberText({
    label: "Daily limit",
    minimum: 1,
    maximum: LIMITS.dailyLimitMaximum,
    optional: true,
  }),
  overbookingPercent: wholeNumberText({
    label: "Overbooking",
    minimum: 0,
    maximum: LIMITS.overbookingMaximumPercent,
  }),
  preparationNotes: z
    .string()
    .trim()
    .max(
      LIMITS.preparationNotesMaximum,
      `Use ${LIMITS.preparationNotesMaximum} characters or fewer.`
    ),
  calendarIds: z.array(z.string()),
  isActive: z.boolean(),
});

export type CreateCalendarFormValues = z.infer<typeof createCalendarFormSchema>;
export type RenameCalendarFormValues = z.infer<typeof renameCalendarFormSchema>;
export type TimeOffFormValues = z.infer<typeof timeOffFormSchema>;
export type AppointmentTypeFormValues = z.infer<
  typeof appointmentTypeFormSchema
>;
