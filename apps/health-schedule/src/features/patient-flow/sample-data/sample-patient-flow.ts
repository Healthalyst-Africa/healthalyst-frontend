import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { SAMPLE_DATA_DELAY_MILLISECONDS } from "~/features/patient-flow/config/sample-data";
import type {
  DayBoard,
  PatientMatch,
  QueueEntry,
  QueueKind,
  QueueSummary,
  TriageBand,
  Visit,
  VisitBoard,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import type {
  CheckInRequest,
  QuickPatientRequest,
  TransferRequest,
  UnknownPatientRequest,
} from "~/features/patient-flow/utilities/patient-flow-requests";
import type { QueueTarget } from "~/features/patient-flow/utilities/queue-targets";
import { isLiveEntryStatus } from "~/features/patient-flow/utilities/front-desk";
import { branchToday, toBranchDateTime } from "~/shared/time/branch-time";

/**
 * Made-up patients, bookings and queues kept in this browser tab, for trying
 * the front desk and queue boards without the API. They behave like the API:
 * checking in, calling, sending on and finishing all change what the pages
 * show. Reloading the page starts again. None of these people are real.
 */

export const SAMPLE_DEPARTMENTS = [
  { id: "sample-department-laboratory", name: "Laboratory", isActive: true },
  { id: "sample-department-pharmacy", name: "Pharmacy", isActive: true },
  { id: "sample-department-radiology", name: "Radiology", isActive: true },
] as const;

const SAMPLE_CALENDARS = [
  {
    resourceId: "sample-calendar-bello",
    name: "Dr Ngozi Bello",
    kind: "PRACTITIONER",
  },
  {
    resourceId: "sample-calendar-adeyemi",
    name: "Dr Tunde Adeyemi",
    kind: "PRACTITIONER",
  },
  {
    resourceId: "sample-calendar-ultrasound",
    name: "Ultrasound room",
    kind: "ROOM",
  },
] as const;

const WAIT_TARGET_MINUTES: Record<QueueKind, number> = {
  TRIAGE: 15,
  CONSULTATION: 30,
  DEPARTMENT: 20,
};
const VISIT_TARGET_MINUTES = 120;
const AMBER_AT_PERCENT = 75;
const ROUTINE_PRIORITY = 3;

type SamplePatient = PatientMatch;

type SampleAppointment = {
  id: string;
  status: "BOOKED" | "ARRIVED" | "COMPLETED" | "NO_SHOW";
  resourceId: string;
  appointmentTypeName: string;
  patientId: string;
  startsAt: string;
};

type SampleVisit = {
  id: string;
  token: string;
  kind: "APPOINTMENT" | "WALK_IN";
  patientId: string;
  appointmentId: string | null;
  triageBand: TriageBand | null;
  checkedInAt: number;
  isOpen: boolean;
};

type SampleEntry = {
  id: string;
  visitId: string;
  kind: QueueKind;
  departmentId: string | null;
  resourceId: string | null;
  status: QueueEntry["status"];
  priority: number;
  enqueuedAt: number;
  calledAt: number | null;
  note: string | null;
  skipCount: number;
};

type SampleState = {
  patients: SamplePatient[];
  appointments: SampleAppointment[];
  visits: SampleVisit[];
  entries: SampleEntry[];
  tokenCounters: { A: number; W: number };
};

const SEXES: readonly SamplePatient["sex"][] = [
  "male",
  "female",
  "other",
  "unknown",
];

function readSex(sex: string): SamplePatient["sex"] {
  return SEXES.find((candidate) => candidate === sex) ?? "unknown";
}

function minutesAgo(minutes: number): number {
  return Date.now() - minutes * 60_000;
}

function samplePatient(
  number: number,
  details: Pick<SamplePatient, "firstName" | "lastName" | "sex"> &
    Partial<SamplePatient>
): SamplePatient {
  return {
    id: `sample-patient-${number}`,
    patientNumber: `HS-${String(10_400 + number).padStart(5, "0")}`,
    folderNumber: null,
    middleName: null,
    dateOfBirth: null,
    dateOfBirthEstimated: false,
    phone: null,
    isTemporary: false,
    temporaryLabel: null,
    ...details,
  };
}

function createInitialState(): SampleState {
  const today = branchToday();
  const at = (time: string) => toBranchDateTime(today, time);
  const patients: SamplePatient[] = [
    samplePatient(1, {
      firstName: "Amina",
      lastName: "Yusuf",
      sex: "female",
      dateOfBirth: "1991-03-08",
      phone: "+2348031234401",
    }),
    samplePatient(2, {
      firstName: "Chidi",
      lastName: "Eze",
      sex: "male",
      dateOfBirth: "1978-11-21",
      phone: "+2348051234402",
    }),
    samplePatient(3, {
      firstName: "Grace",
      lastName: "Okon",
      sex: "female",
      dateOfBirth: "1986-05-12",
      phone: "+2348121232280",
      folderNumber: "OPD/2019/0412",
    }),
    samplePatient(4, {
      firstName: "Musa",
      lastName: "Danjuma",
      sex: "male",
      dateOfBirth: "1965-01-30",
      dateOfBirthEstimated: true,
      phone: "+2347031234404",
    }),
    samplePatient(5, {
      firstName: "Halima",
      lastName: "Sani",
      sex: "female",
      dateOfBirth: "1998-07-02",
      phone: "+2348091234405",
    }),
    samplePatient(6, {
      firstName: "Callistus",
      lastName: "Okafor",
      sex: "male",
      dateOfBirth: "1960-04-17",
      dateOfBirthEstimated: true,
      phone: "+2348031234417",
    }),
    samplePatient(7, {
      firstName: "Grace",
      lastName: "Okafor",
      sex: "female",
      dateOfBirth: "1986-05-12",
      phone: "+2348121232281",
    }),
    samplePatient(8, {
      firstName: "Tunde",
      lastName: "Bakare",
      sex: "male",
      dateOfBirth: "1972-09-09",
      phone: "+2348021234408",
    }),
    samplePatient(9, {
      firstName: "Adaeze",
      lastName: "Bello",
      sex: "female",
      dateOfBirth: "2001-12-25",
      phone: "+2348061234409",
    }),
    samplePatient(10, {
      firstName: "Ibrahim",
      lastName: "Lawal",
      sex: "male",
      dateOfBirth: "1955-06-14",
      phone: "+2348081234410",
    }),
    samplePatient(11, {
      firstName: "Folake",
      lastName: "Adebayo",
      sex: "female",
      dateOfBirth: "1994-02-03",
      phone: "+2348101234411",
    }),
    samplePatient(12, {
      firstName: "Unknown",
      lastName: "Patient",
      sex: "male",
      isTemporary: true,
      temporaryLabel: "Unknown man, brought by ambulance",
    }),
  ];
  const appointments: SampleAppointment[] = [
    {
      id: "sample-appointment-1",
      status: "ARRIVED",
      resourceId: "sample-calendar-bello",
      appointmentTypeName: "General outpatient",
      patientId: "sample-patient-1",
      startsAt: at("09:00"),
    },
    {
      id: "sample-appointment-2",
      status: "ARRIVED",
      resourceId: "sample-calendar-adeyemi",
      appointmentTypeName: "Follow-up",
      patientId: "sample-patient-4",
      startsAt: at("09:15"),
    },
    {
      id: "sample-appointment-3",
      status: "BOOKED",
      resourceId: "sample-calendar-bello",
      appointmentTypeName: "General outpatient",
      patientId: "sample-patient-6",
      startsAt: at("10:00"),
    },
    {
      id: "sample-appointment-4",
      status: "BOOKED",
      resourceId: "sample-calendar-ultrasound",
      appointmentTypeName: "Antenatal scan",
      patientId: "sample-patient-5",
      startsAt: at("10:15"),
    },
    {
      id: "sample-appointment-5",
      status: "BOOKED",
      resourceId: "sample-calendar-adeyemi",
      appointmentTypeName: "Follow-up",
      patientId: "sample-patient-8",
      startsAt: at("10:30"),
    },
    {
      id: "sample-appointment-6",
      status: "BOOKED",
      resourceId: "sample-calendar-bello",
      appointmentTypeName: "New patient",
      patientId: "sample-patient-11",
      startsAt: at("11:45"),
    },
    {
      id: "sample-appointment-7",
      status: "NO_SHOW",
      resourceId: "sample-calendar-adeyemi",
      appointmentTypeName: "Follow-up",
      patientId: "sample-patient-10",
      startsAt: at("08:30"),
    },
  ];
  const visits: SampleVisit[] = [
    {
      id: "sample-visit-1",
      token: "A-001",
      kind: "APPOINTMENT",
      patientId: "sample-patient-1",
      appointmentId: "sample-appointment-1",
      triageBand: "GREEN",
      checkedInAt: minutesAgo(64),
      isOpen: true,
    },
    {
      id: "sample-visit-2",
      token: "W-001",
      kind: "WALK_IN",
      patientId: "sample-patient-2",
      appointmentId: null,
      triageBand: "YELLOW",
      checkedInAt: minutesAgo(52),
      isOpen: true,
    },
    {
      id: "sample-visit-3",
      token: "W-002",
      kind: "WALK_IN",
      patientId: "sample-patient-3",
      appointmentId: null,
      triageBand: null,
      checkedInAt: minutesAgo(18),
      isOpen: true,
    },
    {
      id: "sample-visit-4",
      token: "A-002",
      kind: "APPOINTMENT",
      patientId: "sample-patient-4",
      appointmentId: "sample-appointment-2",
      triageBand: "GREEN",
      checkedInAt: minutesAgo(45),
      isOpen: true,
    },
    {
      id: "sample-visit-5",
      token: "W-003",
      kind: "WALK_IN",
      patientId: "sample-patient-9",
      appointmentId: null,
      triageBand: null,
      checkedInAt: minutesAgo(6),
      isOpen: true,
    },
    {
      id: "sample-visit-6",
      token: "W-004",
      kind: "WALK_IN",
      patientId: "sample-patient-12",
      appointmentId: null,
      triageBand: "RED",
      checkedInAt: minutesAgo(9),
      isOpen: true,
    },
  ];
  const entries: SampleEntry[] = [
    {
      id: "sample-entry-1",
      visitId: "sample-visit-1",
      kind: "CONSULTATION",
      departmentId: null,
      resourceId: "sample-calendar-bello",
      status: "WAITING",
      priority: 3,
      enqueuedAt: minutesAgo(41),
      calledAt: null,
      note: null,
      skipCount: 0,
    },
    {
      id: "sample-entry-2",
      visitId: "sample-visit-2",
      kind: "CONSULTATION",
      departmentId: null,
      resourceId: null,
      status: "WAITING",
      priority: 2,
      enqueuedAt: minutesAgo(27),
      calledAt: null,
      note: "Chest pain since last night",
      skipCount: 0,
    },
    {
      id: "sample-entry-3",
      visitId: "sample-visit-3",
      kind: "TRIAGE",
      departmentId: null,
      resourceId: null,
      status: "WAITING",
      priority: 3,
      enqueuedAt: minutesAgo(18),
      calledAt: null,
      note: null,
      skipCount: 0,
    },
    {
      id: "sample-entry-4",
      visitId: "sample-visit-4",
      kind: "DEPARTMENT",
      departmentId: "sample-department-laboratory",
      resourceId: null,
      status: "IN_SERVICE",
      priority: 3,
      enqueuedAt: minutesAgo(12),
      calledAt: minutesAgo(4),
      note: "Full blood count and malaria test",
      skipCount: 0,
    },
    {
      id: "sample-entry-5",
      visitId: "sample-visit-5",
      kind: "TRIAGE",
      departmentId: null,
      resourceId: null,
      status: "WAITING",
      priority: 3,
      enqueuedAt: minutesAgo(6),
      calledAt: null,
      note: null,
      skipCount: 0,
    },
    {
      id: "sample-entry-6",
      visitId: "sample-visit-6",
      kind: "CONSULTATION",
      departmentId: null,
      resourceId: null,
      status: "CALLED",
      priority: 1,
      enqueuedAt: minutesAgo(7),
      calledAt: minutesAgo(1),
      note: "Unconscious on arrival",
      skipCount: 0,
    },
  ];
  return {
    patients,
    appointments,
    visits,
    entries,
    tokenCounters: { A: 2, W: 4 },
  };
}

let sampleState: SampleState | null = null;

function state(): SampleState {
  sampleState ??= createInitialState();
  return sampleState;
}

function wait<Result>(result: () => Result): Promise<Result> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(result());
      } catch (error) {
        reject(error);
      }
    }, SAMPLE_DATA_DELAY_MILLISECONDS)
  );
}

function refusal(
  message: string,
  code: string,
  status = 409
): PlatformApiError {
  return new PlatformApiError(message, code, null, status, {}, null);
}

function clockState(minutes: number, target: number) {
  if (minutes > target) return "RED" as const;
  if (minutes >= (target * AMBER_AT_PERCENT) / 100) return "AMBER" as const;
  return "GREEN" as const;
}

function minutesSince(time: number): number {
  return Math.max(0, Math.floor((Date.now() - time) / 60_000));
}

function findPatient(patientId: string): SamplePatient {
  const patient = state().patients.find(
    (candidate) => candidate.id === patientId
  );
  if (!patient) throw refusal("Patient was not found.", "NOT_FOUND", 404);
  return patient;
}

function patientSummary(patientId: string) {
  const patient = findPatient(patientId);
  return {
    id: patient.id,
    patientNumber: patient.patientNumber,
    firstName: patient.isTemporary
      ? (patient.temporaryLabel ?? "Unknown patient")
      : patient.firstName,
    lastName: patient.isTemporary ? "" : patient.lastName,
    phone: patient.phone,
  };
}

function calendarName(resourceId: string | null): string | null {
  return (
    SAMPLE_CALENDARS.find((calendar) => calendar.resourceId === resourceId)
      ?.name ?? null
  );
}

function departmentName(departmentId: string | null): string | null {
  return (
    SAMPLE_DEPARTMENTS.find((department) => department.id === departmentId)
      ?.name ?? null
  );
}

function findVisit(visitId: string): SampleVisit {
  const visit = state().visits.find((candidate) => candidate.id === visitId);
  if (!visit) throw refusal("Visit was not found.", "NOT_FOUND", 404);
  return visit;
}

function toQueueEntry(entry: SampleEntry): QueueEntry {
  const visit = findVisit(entry.visitId);
  const appointment = state().appointments.find(
    (candidate) => candidate.id === visit.appointmentId
  );
  const waitingMinutes =
    minutesSince(entry.enqueuedAt) -
    (entry.calledAt === null ? 0 : minutesSince(entry.calledAt));
  const visitMinutes = minutesSince(visit.checkedInAt);
  return {
    id: entry.id,
    visitId: entry.visitId,
    token: visit.token,
    patient: patientSummary(visit.patientId),
    kind: entry.kind,
    departmentId: entry.departmentId,
    departmentName: departmentName(entry.departmentId),
    resourceId: entry.resourceId,
    resourceName: calendarName(entry.resourceId),
    status: entry.status,
    triageBand: visit.triageBand,
    appointment: appointment
      ? {
          id: appointment.id,
          startsAt: appointment.startsAt,
          appointmentTypeName: appointment.appointmentTypeName,
        }
      : null,
    note: entry.note,
    skipCount: entry.skipCount,
    enqueuedAt: new Date(entry.enqueuedAt).toISOString(),
    waitingMinutes,
    waitTargetMinutes: WAIT_TARGET_MINUTES[entry.kind],
    waitState:
      entry.status === "WAITING"
        ? clockState(waitingMinutes, WAIT_TARGET_MINUTES[entry.kind])
        : null,
    visitMinutes,
    visitState: clockState(visitMinutes, VISIT_TARGET_MINUTES),
  };
}

function liveEntries(): SampleEntry[] {
  return state().entries.filter((entry) => isLiveEntryStatus(entry.status));
}

function currentEntry(visitId: string): SampleEntry | undefined {
  return liveEntries().find((entry) => entry.visitId === visitId);
}

function matchesQueue(entry: SampleEntry, target: QueueTarget): boolean {
  if (entry.kind !== target.kind) return false;
  if (target.kind === "DEPARTMENT") {
    return entry.departmentId === target.departmentId;
  }
  if (target.kind === "CONSULTATION" && target.resourceId) {
    return entry.resourceId === target.resourceId || entry.resourceId === null;
  }
  return true;
}

function callingOrder(first: SampleEntry, second: SampleEntry): number {
  return (
    first.priority - second.priority || first.enqueuedAt - second.enqueuedAt
  );
}

function findLiveEntry(entryId: string): SampleEntry {
  const entry = liveEntries().find((candidate) => candidate.id === entryId);
  if (!entry) {
    throw refusal(
      "This patient was already called, moved or seen. Refresh the queue.",
      "QUEUE_ENTRY_MOVED"
    );
  }
  return entry;
}

function targetFields(target: QueueTarget) {
  return {
    kind: target.kind,
    departmentId: target.kind === "DEPARTMENT" ? target.departmentId : null,
    resourceId:
      target.kind === "CONSULTATION" ? (target.resourceId ?? null) : null,
  };
}

export function getSampleDayBoard(): Promise<DayBoard> {
  return wait(() => {
    const { appointments } = state();
    const count = (status: SampleAppointment["status"]) =>
      appointments.filter((appointment) => appointment.status === status)
        .length;
    return {
      summary: {
        booked: count("BOOKED"),
        arrived: count("ARRIVED"),
        completed: count("COMPLETED"),
        noShow: count("NO_SHOW"),
      },
      calendars: SAMPLE_CALENDARS.map((calendar) => ({
        resourceId: calendar.resourceId,
        name: calendar.name,
        kind: calendar.kind,
        appointments: appointments
          .filter(
            (appointment) => appointment.resourceId === calendar.resourceId
          )
          .map((appointment) => ({
            id: appointment.id,
            status: appointment.status,
            resourceName: calendar.name,
            appointmentTypeName: appointment.appointmentTypeName,
            patient: patientSummary(appointment.patientId),
            startsAt: appointment.startsAt,
          })),
      })),
    };
  });
}

export function getSampleVisitBoard(): Promise<VisitBoard> {
  return wait(() => {
    const openVisits = state()
      .visits.filter((visit) => visit.isOpen)
      .map((visit) => {
        const entry = currentEntry(visit.id);
        const view = entry ? toQueueEntry(entry) : null;
        const visitMinutes = minutesSince(visit.checkedInAt);
        return {
          visitId: visit.id,
          token: visit.token,
          kind: visit.kind,
          patient: patientSummary(visit.patientId),
          triageBand: visit.triageBand,
          checkedInAt: new Date(visit.checkedInAt).toISOString(),
          visitMinutes,
          visitState: clockState(visitMinutes, VISIT_TARGET_MINUTES),
          current:
            view && entry && isLiveEntryStatus(view.status)
              ? {
                  kind: view.kind,
                  departmentName: view.departmentName,
                  resourceName: view.resourceName,
                  status: view.status,
                  minutes:
                    view.status === "WAITING"
                      ? view.waitingMinutes
                      : minutesSince(entry.calledAt ?? entry.enqueuedAt),
                  state: view.waitState,
                }
              : null,
        };
      })
      .sort((first, second) => second.visitMinutes - first.visitMinutes);
    return {
      summary: {
        open: openVisits.length,
        overTarget: openVisits.filter((visit) => visit.visitState === "RED")
          .length,
      },
      data: openVisits,
    };
  });
}

export function searchSamplePatients(
  searchText: string
): Promise<PatientMatch[]> {
  return wait(() => {
    const words = searchText.toLowerCase().split(/\s+/).filter(Boolean);
    const digits = searchText.replace(/\D/g, "");
    return state().patients.filter((patient) => {
      const text = [
        patient.firstName,
        patient.lastName,
        patient.temporaryLabel ?? "",
        patient.patientNumber,
        patient.folderNumber ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const phoneMatches =
        digits.length >= 4 &&
        (patient.phone ?? "")
          .replace(/\D/g, "")
          .includes(digits.replace(/^0/, ""));
      return phoneMatches || words.every((word) => text.includes(word));
    });
  });
}

export function registerSampleQuickPatient(
  request: QuickPatientRequest & { id: string }
): Promise<PatientMatch> {
  return wait(() => {
    const patients = state().patients;
    const patient = samplePatient(patients.length + 1, {
      id: request.id,
      firstName: request.firstName,
      lastName: request.lastName,
      sex: readSex(request.sex),
      phone: request.phone,
    });
    patients.push(patient);
    return patient;
  });
}

export function registerSampleUnknownPatient(
  request: UnknownPatientRequest & { id: string }
): Promise<PatientMatch> {
  return wait(() => {
    const patients = state().patients;
    const patient = samplePatient(patients.length + 1, {
      id: request.id,
      firstName: "Unknown",
      lastName: "Patient",
      sex: readSex(request.sex),
      isTemporary: true,
      temporaryLabel: request.label,
    });
    patients.push(patient);
    return patient;
  });
}

export function checkInSamplePatient(request: CheckInRequest): Promise<Visit> {
  return wait(() => {
    const currentState = state();
    let patientId = request.patientId ?? "";
    const appointment = currentState.appointments.find(
      (candidate) => candidate.id === request.appointmentId
    );
    if (request.appointmentId) {
      if (!appointment)
        throw refusal("Appointment was not found.", "NOT_FOUND", 404);
      if (appointment.status !== "BOOKED") {
        throw refusal(
          "This patient is already checked in for this appointment.",
          "APPOINTMENT_ALREADY_CHECKED_IN"
        );
      }
      patientId = appointment.patientId;
    }
    findPatient(patientId);
    if (
      currentState.visits.some(
        (visit) => visit.isOpen && visit.patientId === patientId
      )
    ) {
      throw refusal(
        "This patient is already checked in. Find them in the queue.",
        "VISIT_ALREADY_OPEN"
      );
    }
    if (appointment) appointment.status = "ARRIVED";
    const prefix = appointment ? "A" : "W";
    currentState.tokenCounters[prefix] += 1;
    const visit: SampleVisit = {
      id: request.id,
      token: `${prefix}-${String(currentState.tokenCounters[prefix]).padStart(3, "0")}`,
      kind: appointment ? "APPOINTMENT" : "WALK_IN",
      patientId,
      appointmentId: appointment?.id ?? null,
      triageBand: null,
      checkedInAt: Date.now(),
      isOpen: true,
    };
    const entry: SampleEntry = {
      id: crypto.randomUUID(),
      visitId: visit.id,
      ...targetFields(request.queue),
      status: "WAITING",
      priority: ROUTINE_PRIORITY,
      enqueuedAt: Date.now(),
      calledAt: null,
      note: request.note ?? null,
      skipCount: 0,
    };
    currentState.visits.push(visit);
    currentState.entries.push(entry);
    return {
      id: visit.id,
      token: visit.token,
      patient: patientSummary(patientId),
      kind: visit.kind,
      current: toQueueEntry(entry),
    };
  });
}

export function listSampleQueueSummaries(): Promise<QueueSummary[]> {
  return wait(() => {
    type QueueGroup = {
      kind: QueueKind;
      departmentId: string | null;
      resourceId: string | null;
      entries: SampleEntry[];
    };
    const groups = new Map<string, QueueGroup>([
      [
        "TRIAGE||",
        { kind: "TRIAGE", departmentId: null, resourceId: null, entries: [] },
      ],
    ]);
    for (const entry of liveEntries()) {
      const key = `${entry.kind}|${entry.departmentId ?? ""}|${entry.resourceId ?? ""}`;
      const group = groups.get(key) ?? {
        kind: entry.kind,
        departmentId: entry.departmentId,
        resourceId: entry.resourceId,
        entries: [],
      };
      group.entries.push(entry);
      groups.set(key, group);
    }
    return [...groups.values()].map((group) => {
      const { entries } = group;
      const waiting = entries.filter((entry) => entry.status === "WAITING");
      return {
        kind: group.kind,
        departmentId: group.departmentId,
        departmentName: departmentName(group.departmentId),
        resourceId: group.resourceId,
        resourceName: calendarName(group.resourceId),
        waiting: waiting.length,
        called: entries.filter((entry) => entry.status === "CALLED").length,
        inService: entries.filter((entry) => entry.status === "IN_SERVICE")
          .length,
        longestWaitMinutes: Math.max(
          0,
          ...waiting.map((entry) => minutesSince(entry.enqueuedAt))
        ),
      };
    });
  });
}

export function listSampleQueueEntries(
  target: QueueTarget
): Promise<QueueEntry[]> {
  return wait(() =>
    liveEntries()
      .filter((entry) => matchesQueue(entry, target))
      .sort(callingOrder)
      .map(toQueueEntry)
  );
}

export function callNextSamplePatient(
  target: QueueTarget
): Promise<QueueEntry> {
  return wait(() => {
    const [next] = liveEntries()
      .filter(
        (entry) => entry.status === "WAITING" && matchesQueue(entry, target)
      )
      .sort(callingOrder);
    if (!next)
      throw refusal("Nobody is waiting in this queue.", "QUEUE_EMPTY", 404);
    next.status = "CALLED";
    next.calledAt = Date.now();
    return toQueueEntry(next);
  });
}

export function callSamplePatient(entryId: string): Promise<QueueEntry> {
  return wait(() => {
    const entry = findLiveEntry(entryId);
    entry.status = "CALLED";
    entry.calledAt = Date.now();
    return toQueueEntry(entry);
  });
}

export function startSeeingSamplePatient(entryId: string): Promise<QueueEntry> {
  return wait(() => {
    const entry = findLiveEntry(entryId);
    entry.status = "IN_SERVICE";
    entry.calledAt ??= Date.now();
    return toQueueEntry(entry);
  });
}

export function skipSamplePatient(entryId: string): Promise<QueueEntry> {
  return wait(() => {
    const entry = findLiveEntry(entryId);
    entry.status = "WAITING";
    entry.calledAt = null;
    entry.skipCount += 1;
    entry.enqueuedAt = Date.now();
    return toQueueEntry(entry);
  });
}

export function sendSamplePatientOn(
  entryId: string,
  request: TransferRequest
): Promise<QueueEntry> {
  return wait(() => {
    const entry = findLiveEntry(entryId);
    entry.status = "TRANSFERRED";
    const nextEntry: SampleEntry = {
      id: crypto.randomUUID(),
      visitId: entry.visitId,
      ...targetFields(request.to),
      status: "WAITING",
      priority: entry.priority,
      enqueuedAt: Date.now(),
      calledAt: null,
      note: request.note ?? null,
      skipCount: 0,
    };
    state().entries.push(nextEntry);
    return toQueueEntry(nextEntry);
  });
}

export function finishSampleVisit(visitId: string): Promise<void> {
  return wait(() => {
    const visit = findVisit(visitId);
    if (!visit.isOpen) {
      throw refusal("This visit has already ended.", "VISIT_NOT_OPEN");
    }
    visit.isOpen = false;
    for (const entry of liveEntries()) {
      if (entry.visitId === visitId) entry.status = "DONE";
    }
    const appointment = state().appointments.find(
      (candidate) => candidate.id === visit.appointmentId
    );
    if (appointment) appointment.status = "COMPLETED";
  });
}
