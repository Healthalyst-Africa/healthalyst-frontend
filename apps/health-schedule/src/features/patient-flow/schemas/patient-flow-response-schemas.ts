import { z } from "zod";

const queueKindSchema = z.enum(["TRIAGE", "CONSULTATION", "DEPARTMENT"]);
const liveEntryStatusSchema = z.enum(["WAITING", "CALLED", "IN_SERVICE"]);
const triageBandSchema = z.enum(["RED", "YELLOW", "GREEN"]);
const clockStateSchema = z.enum(["GREEN", "AMBER", "RED"]);

const patientSummarySchema = z.object({
  id: z.string(),
  patientNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
});

/** One patient's place in a queue (`GET /v1/queue/entries`). */
export const queueEntrySchema = z.object({
  id: z.string(),
  visitId: z.string(),
  token: z.string(),
  patient: patientSummarySchema,
  kind: queueKindSchema,
  departmentId: z.string().nullable(),
  departmentName: z.string().nullable(),
  resourceId: z.string().nullable(),
  resourceName: z.string().nullable(),
  status: z.enum([
    "WAITING",
    "CALLED",
    "IN_SERVICE",
    "DONE",
    "TRANSFERRED",
    "LEFT",
  ]),
  triageBand: triageBandSchema.nullable(),
  appointment: z
    .object({
      id: z.string(),
      startsAt: z.string(),
      appointmentTypeName: z.string(),
    })
    .nullable(),
  note: z.string().nullable(),
  skipCount: z.number().int(),
  enqueuedAt: z.string(),
  waitingMinutes: z.number().int(),
  waitTargetMinutes: z.number().int(),
  waitState: clockStateSchema.nullable(),
  visitMinutes: z.number().int(),
  visitState: clockStateSchema,
});

export const queueEntryListSchema = z.object({
  data: z.array(queueEntrySchema),
});

/** The visit a check-in opens (`POST /v1/queue/check-ins`). */
export const visitSchema = z.object({
  id: z.string(),
  token: z.string(),
  patient: patientSummarySchema,
  kind: z.enum(["APPOINTMENT", "WALK_IN"]),
  current: queueEntrySchema.nullable(),
});

/** Every queue of the branch with someone in it; triage is always listed. */
export const queueSummaryListSchema = z.object({
  data: z.array(
    z.object({
      kind: queueKindSchema,
      departmentId: z.string().nullable(),
      departmentName: z.string().nullable(),
      resourceId: z.string().nullable(),
      resourceName: z.string().nullable(),
      waiting: z.number().int(),
      called: z.number().int(),
      inService: z.number().int(),
      longestWaitMinutes: z.number().int(),
    })
  ),
});

/** Open visits at the branch, the longest-running clocks first. */
export const visitBoardSchema = z.object({
  summary: z.object({
    open: z.number().int(),
    overTarget: z.number().int(),
  }),
  data: z.array(
    z.object({
      visitId: z.string(),
      token: z.string(),
      kind: z.enum(["APPOINTMENT", "WALK_IN"]),
      patient: patientSummarySchema,
      triageBand: triageBandSchema.nullable(),
      checkedInAt: z.string(),
      visitMinutes: z.number().int(),
      visitState: clockStateSchema,
      current: z
        .object({
          kind: queueKindSchema,
          departmentName: z.string().nullable(),
          resourceName: z.string().nullable(),
          status: liveEntryStatusSchema,
          minutes: z.number().int(),
          state: clockStateSchema.nullable(),
        })
        .nullable(),
    })
  ),
});

const dayBoardAppointmentSchema = z.object({
  id: z.string(),
  status: z.string(),
  resourceName: z.string(),
  appointmentTypeName: z.string(),
  patient: patientSummarySchema.nullable(),
  startsAt: z.string(),
});

/** Today's appointments at the branch (`GET /v1/appointments/day-board`). */
export const dayBoardSchema = z.object({
  summary: z.object({
    booked: z.number().int(),
    arrived: z.number().int(),
    completed: z.number().int(),
    noShow: z.number().int(),
  }),
  calendars: z.array(
    z.object({
      resourceId: z.string(),
      name: z.string(),
      kind: z.enum(["PRACTITIONER", "ROOM", "EQUIPMENT"]),
      appointments: z.array(dayBoardAppointmentSchema),
    })
  ),
});

/** A search hit: enough to pick the right person. */
export const patientMatchSchema = z.object({
  id: z.string(),
  patientNumber: z.string(),
  folderNumber: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullable(),
  sex: z.enum(["male", "female", "other", "unknown"]),
  dateOfBirth: z.string().nullable(),
  dateOfBirthEstimated: z.boolean(),
  phone: z.string().nullable(),
  isTemporary: z.boolean(),
  temporaryLabel: z.string().nullable(),
});

export const patientSearchResultSchema = z.object({
  data: z.array(patientMatchSchema),
});

export type QueueEntry = z.infer<typeof queueEntrySchema>;
export type QueueKind = z.infer<typeof queueKindSchema>;
export type QueueSummary = z.infer<
  typeof queueSummaryListSchema
>["data"][number];
export type Visit = z.infer<typeof visitSchema>;
export type VisitBoard = z.infer<typeof visitBoardSchema>;
export type OpenVisit = VisitBoard["data"][number];
export type DayBoard = z.infer<typeof dayBoardSchema>;
export type DayBoardAppointment = z.infer<typeof dayBoardAppointmentSchema>;
export type PatientMatch = z.infer<typeof patientMatchSchema>;
export type TriageBand = z.infer<typeof triageBandSchema>;
