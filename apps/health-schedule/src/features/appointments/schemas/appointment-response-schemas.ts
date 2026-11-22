import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "HELD",
  "BOOKED",
  "ARRIVED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RELEASED",
]);

const patientSummarySchema = z.object({
  id: z.string(),
  patientNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
});

/** One appointment, or a hold on a time while it is being booked. */
export const appointmentSchema = z.object({
  id: z.string(),
  status: appointmentStatusSchema,
  branchId: z.string(),
  resourceId: z.string(),
  resourceName: z.string(),
  appointmentTypeId: z.string(),
  appointmentTypeName: z.string(),
  patient: patientSummarySchema.nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  holdExpiresAt: z.string().nullish(),
  isNewPatient: z.boolean(),
  isOverride: z.boolean(),
  notes: z.string().nullable(),
  source: z.enum(["STAFF", "ONLINE"]),
  rescheduleCount: z.number().int(),
  cancelReason: z.string().nullable(),
  cancelledBy: z.enum(["PATIENT", "FACILITY"]).nullish(),
  bookedAt: z.string().nullish(),
  version: z.number().int(),
});

export const appointmentListSchema = z.object({
  timeZone: z.string(),
  data: z.array(appointmentSchema),
});

/** Free times of an appointment type (`GET /v1/schedule/slots`). */
export const slotListSchema = z.object({
  timeZone: z.string(),
  data: z.array(
    z.object({
      resourceId: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
      available: z.number().int(),
    })
  ),
});

const appointmentIssueSchema = z.enum(["CLOSED", "OUTSIDE_HOURS"]);

/** A branch's day, calendar by calendar (`GET /v1/appointments/day-board`). */
export const dayBoardSchema = z.object({
  date: z.string(),
  timeZone: z.string(),
  branchId: z.string(),
  summary: z.object({
    booked: z.number().int(),
    arrived: z.number().int(),
    completed: z.number().int(),
    cancelled: z.number().int(),
    noShow: z.number().int(),
    needsAttention: z.number().int(),
    waiting: z.number().int(),
  }),
  calendars: z.array(
    z.object({
      resourceId: z.string(),
      name: z.string(),
      kind: z.enum(["PRACTITIONER", "ROOM", "EQUIPMENT"]),
      hours: z.array(z.object({ startTime: z.string(), endTime: z.string() })),
      closures: z.array(
        z.object({
          kind: z.enum(["LEAVE", "BREAK", "HOLIDAY", "BLOCK"]),
          startsAt: z.string(),
          endsAt: z.string(),
          reason: z.string().nullable(),
        })
      ),
      appointments: z.array(
        appointmentSchema.extend({ issue: appointmentIssueSchema.nullable() })
      ),
    })
  ),
});

export const timeOfDaySchema = z.enum(["ANY", "MORNING", "AFTERNOON"]);

/** A patient waiting for a time to come free. */
export const waitlistEntrySchema = z.object({
  id: z.string(),
  patient: patientSummarySchema,
  appointmentTypeId: z.string(),
  appointmentTypeName: z.string(),
  branchId: z.string(),
  resourceId: z.string().nullish(),
  resourceName: z.string().nullish(),
  fromDate: z.string(),
  toDate: z.string(),
  timeOfDay: timeOfDaySchema,
  isNewPatient: z.boolean(),
  notes: z.string().nullable(),
  status: z.enum(["WAITING", "BOOKED", "REMOVED"]),
  appointmentId: z.string().nullish(),
  removedReason: z.string().nullable(),
  isExpired: z.boolean(),
  waitingSince: z.string(),
  version: z.number().int(),
});

export const waitlistSchema = z.object({
  data: z.array(waitlistEntrySchema),
});

export type Appointment = z.infer<typeof appointmentSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
export type Slot = z.infer<typeof slotListSchema>["data"][number];
export type DayBoard = z.infer<typeof dayBoardSchema>;
export type DayBoardCalendar = DayBoard["calendars"][number];
export type DayBoardAppointment = DayBoardCalendar["appointments"][number];
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;
