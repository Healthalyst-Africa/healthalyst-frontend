import { z } from "zod";

const calendarKindSchema = z.enum(["PRACTITIONER", "ROOM", "EQUIPMENT"]);

export const availabilityRuleSchema = z.object({
  branchId: z.string().uuid(),
  weekday: z.number().int().min(1).max(7),
  startTime: z.string(),
  endTime: z.string(),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
});

export const scheduleCalendarSchema = z.object({
  id: z.string().uuid(),
  kind: calendarKindSchema,
  memberId: z.string().uuid().nullable(),
  branchId: z.string().uuid().nullable(),
  name: z.string(),
  isActive: z.boolean(),
  availability: z.array(availabilityRuleSchema),
  appointmentTypeIds: z.array(z.string().uuid()),
  version: z.number().int(),
});

export const scheduleCalendarListSchema = z.object({
  data: z.array(scheduleCalendarSchema),
});

export const timeOffKindSchema = z.enum(["LEAVE", "BREAK", "HOLIDAY", "BLOCK"]);

export const timeOffEntrySchema = z.object({
  id: z.string().uuid(),
  resourceId: z.string().uuid().nullable(),
  branchId: z.string().uuid().nullable(),
  kind: timeOffKindSchema,
  startsAt: z.string(),
  endsAt: z.string(),
  reason: z.string().nullable(),
});

export const timeOffListSchema = z.object({
  data: z.array(timeOffEntrySchema),
});

export const modalitySchema = z.enum(["IN_PERSON", "VIDEO", "AUDIO", "HOME"]);

export const appointmentTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  durationMinutes: z.number().int(),
  newPatientDurationMinutes: z.number().int().nullable(),
  bufferMinutes: z.number().int(),
  priceKobo: z.number().int().nullable(),
  modality: modalitySchema,
  capacity: z.number().int(),
  minLeadMinutes: z.number().int(),
  maxAdvanceDays: z.number().int(),
  dailyCap: z.number().int().nullable(),
  overbookPercent: z.number().int(),
  prepNotes: z.string().nullable(),
  isActive: z.boolean(),
  resourceIds: z.array(z.string().uuid()),
  version: z.number().int(),
});

export const appointmentTypeListSchema = z.object({
  data: z.array(appointmentTypeSchema),
});

/** The fields the practitioner picker needs from `GET /v1/staff`. */
export const staffMemberSummarySchema = z.object({
  membershipId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  jobTitle: z.string().nullable(),
});

export const staffMemberSummaryListSchema = z.object({
  data: z.array(staffMemberSummarySchema),
  page: z.object({ hasMore: z.boolean() }),
});

export type AvailabilityRule = z.infer<typeof availabilityRuleSchema>;
export type ScheduleCalendar = z.infer<typeof scheduleCalendarSchema>;
export type CalendarKind = z.infer<typeof calendarKindSchema>;
export type TimeOffEntry = z.infer<typeof timeOffEntrySchema>;
export type TimeOffKind = z.infer<typeof timeOffKindSchema>;
export type AppointmentType = z.infer<typeof appointmentTypeSchema>;
export type Modality = z.infer<typeof modalitySchema>;
export type StaffMemberSummary = z.infer<typeof staffMemberSummarySchema>;
