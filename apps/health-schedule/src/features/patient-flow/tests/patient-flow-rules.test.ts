import { describe, expect, it } from "vitest";
import {
  checkInFormSchema,
  unknownPatientFormSchema,
} from "~/features/patient-flow/schemas/patient-flow-form-schemas";
import type {
  DayBoard,
  PatientMatch,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describeMinutes,
  describePatientMatch,
  describeWait,
  findExpectedArrival,
  isLiveEntryStatus,
  listExpectedArrivals,
  readFlowEmphasis,
  sortByTriage,
  summarizeFrontDesk,
} from "~/features/patient-flow/utilities/front-desk";
import {
  toCheckInRequest,
  toTransferRequest,
  toUnknownPatientRequest,
} from "~/features/patient-flow/utilities/patient-flow-requests";
import { toInternationalPhoneNumber } from "~/shared/contact/phone-number";
import {
  buildQueueBoardOptions,
  buildQueueTargetOptions,
  decodeQueueTarget,
  describeQueue,
  encodeQueueTarget,
  readQueueTargetChoices,
} from "~/features/patient-flow/utilities/queue-targets";

const BRANCH_ID = "0f6b4c2a-1d3e-4f5a-8b7c-9d0e1f2a3b4c";
const DOCTOR_BELLO = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
const DOCTOR_ADEYEMI = "2b3c4d5e-6f70-4b8c-9d0e-1f2a3b4c5d6e";
const LABORATORY = "3c4d5e6f-7081-4c9d-8e0f-2a3b4c5d6e7f";

function patient(identifier: string, firstName: string) {
  return {
    id: identifier,
    patientNumber: `HS-${identifier.slice(0, 5)}`,
    firstName,
    lastName: "Okafor",
    phone: null,
  };
}

const DAY_BOARD: DayBoard = {
  summary: { booked: 2, arrived: 1, completed: 0, noShow: 0 },
  calendars: [
    {
      resourceId: DOCTOR_BELLO,
      name: "Dr Bello",
      kind: "PRACTITIONER",
      appointments: [
        {
          id: "appointment-late",
          status: "BOOKED",
          resourceName: "Dr Bello",
          appointmentTypeName: "Follow-up",
          patient: patient("patient-grace", "Grace"),
          startsAt: "2026-11-16T10:30:00+01:00",
        },
        {
          id: "appointment-arrived",
          status: "ARRIVED",
          resourceName: "Dr Bello",
          appointmentTypeName: "Follow-up",
          patient: patient("patient-musa", "Musa"),
          startsAt: "2026-11-16T09:00:00+01:00",
        },
      ],
    },
    {
      resourceId: "room-1",
      name: "Ultrasound room",
      kind: "ROOM",
      appointments: [
        {
          id: "appointment-early",
          status: "BOOKED",
          resourceName: "Ultrasound room",
          appointmentTypeName: "Scan",
          patient: patient("patient-amina", "Amina"),
          startsAt: "2026-11-16T09:15:00+01:00",
        },
      ],
    },
    {
      resourceId: DOCTOR_ADEYEMI,
      name: "Dr Adeyemi",
      kind: "PRACTITIONER",
      appointments: [],
    },
  ],
};

const DEPARTMENTS = [
  { id: LABORATORY, name: "Laboratory", isActive: true },
  { id: "closed-department", name: "Old pharmacy", isActive: false },
];

describe("phone numbers", () => {
  it.each([
    ["0803 123 4567", "+2348031234567"],
    ["08031234567", "+2348031234567"],
    ["+234 803 123 4567", "+2348031234567"],
    ["2348031234567", "+2348031234567"],
    ["(0803) 123-4567", "+2348031234567"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("reads %s as %s", (input, expected) => {
    expect(toInternationalPhoneNumber(input)).toBe(expected);
  });

  it.each(["", "0803", "call me", "8031234567", "+0803123"])(
    "refuses %s",
    (input) => {
      expect(toInternationalPhoneNumber(input)).toBeNull();
    }
  );
});

describe("queue targets", () => {
  it("round-trips every kind of queue through a select value", () => {
    const targets = [
      { kind: "TRIAGE" },
      { kind: "CONSULTATION" },
      { kind: "CONSULTATION", resourceId: DOCTOR_BELLO },
      { kind: "DEPARTMENT", departmentId: LABORATORY },
    ] as const;
    for (const target of targets) {
      expect(decodeQueueTarget(encodeQueueTarget(target))).toEqual(target);
    }
  });

  it("refuses values that are not queues", () => {
    expect(decodeQueueTarget("")).toBeNull();
    expect(decodeQueueTarget("DEPARTMENT")).toBeNull();
    expect(decodeQueueTarget("TRIAGE:extra")).toBeNull();
    expect(decodeQueueTarget("CONSULTATION:a:b")).toBeNull();
  });

  it("offers triage first, then doctors working today and open departments", () => {
    const options = buildQueueTargetOptions(
      readQueueTargetChoices(DAY_BOARD, DEPARTMENTS)
    );
    expect(options.map((option) => option.label)).toEqual([
      "Triage (vitals first)",
      "Next free doctor",
      "Dr Adeyemi",
      "Dr Bello",
      "Laboratory",
    ]);
  });

  it("counts a doctor's own patients and those for the next free doctor", () => {
    const options = buildQueueBoardOptions(
      readQueueTargetChoices(DAY_BOARD, DEPARTMENTS),
      [
        { kind: "TRIAGE", departmentId: null, resourceId: null, waiting: 3 },
        {
          kind: "CONSULTATION",
          departmentId: null,
          resourceId: null,
          waiting: 2,
        },
        {
          kind: "CONSULTATION",
          departmentId: null,
          resourceId: DOCTOR_BELLO,
          waiting: 1,
        },
        {
          kind: "DEPARTMENT",
          departmentId: LABORATORY,
          resourceId: null,
          waiting: 0,
        },
      ]
    );
    expect(options.map((option) => option.label)).toEqual([
      "Triage · 3 waiting",
      "All doctors · 3 waiting",
      "Dr Adeyemi · 2 waiting",
      "Dr Bello · 3 waiting",
      "Laboratory",
    ]);
  });

  it("names where a patient is", () => {
    expect(
      describeQueue({
        kind: "CONSULTATION",
        departmentName: null,
        resourceName: null,
      })
    ).toBe("Next free doctor");
    expect(
      describeQueue({
        kind: "DEPARTMENT",
        departmentName: "Laboratory",
        resourceName: null,
      })
    ).toBe("Laboratory");
  });
});

describe("check-in requests", () => {
  it("checks a booked patient in for the appointment, to triage by default", () => {
    expect(
      toCheckInRequest({
        checkInIdentifier: "visit-1",
        branchId: BRANCH_ID,
        arrival: { kind: "appointment", appointmentId: "appointment-early" },
        values: { queueTarget: "TRIAGE", note: "  " },
      })
    ).toEqual({
      id: "visit-1",
      branchId: BRANCH_ID,
      appointmentId: "appointment-early",
      queue: { kind: "TRIAGE" },
    });
  });

  it("can send a walk-in straight to a department with a note", () => {
    expect(
      toCheckInRequest({
        checkInIdentifier: "visit-2",
        branchId: BRANCH_ID,
        arrival: { kind: "walk-in", patientId: "patient-grace" },
        values: {
          queueTarget: `DEPARTMENT:${LABORATORY}`,
          note: " Brought a lab request form ",
        },
      })
    ).toEqual({
      id: "visit-2",
      branchId: BRANCH_ID,
      patientId: "patient-grace",
      queue: { kind: "DEPARTMENT", departmentId: LABORATORY },
      note: "Brought a lab request form",
    });
  });

  it("sends a patient on to a doctor", () => {
    expect(
      toTransferRequest({
        queueTarget: `CONSULTATION:${DOCTOR_BELLO}`,
        note: "",
      })
    ).toEqual({ to: { kind: "CONSULTATION", resourceId: DOCTOR_BELLO } });
  });

  it("shapes unknown-patient registrations", () => {
    expect(
      toUnknownPatientRequest({
        sex: "male",
        approximateAge: "",
        label: " Unknown man, brought by ambulance ",
      })
    ).toEqual({ sex: "male", label: "Unknown man, brought by ambulance" });
    expect(
      toUnknownPatientRequest({
        sex: "male",
        approximateAge: "40",
        label: "Unknown man",
      })
    ).toEqual({ sex: "male", label: "Unknown man", ageYears: 40 });
  });
});

describe("form rules", () => {
  it("accepts an unknown patient without an age, but not a made-up age", () => {
    expect(
      unknownPatientFormSchema.safeParse({
        sex: "unknown",
        approximateAge: "",
        label: "Unknown woman",
      }).success
    ).toBe(true);
    expect(
      unknownPatientFormSchema.safeParse({
        sex: "unknown",
        approximateAge: "about 40",
        label: "Unknown woman",
      }).success
    ).toBe(false);
  });

  it("limits the check-in note", () => {
    expect(
      checkInFormSchema.safeParse({
        queueTarget: "TRIAGE",
        note: "x".repeat(501),
      }).success
    ).toBe(false);
  });
});

describe("front desk", () => {
  it("lists only patients still expected today, earliest first", () => {
    const arrivals = listExpectedArrivals(DAY_BOARD);
    expect(arrivals.map((appointment) => appointment.id)).toEqual([
      "appointment-early",
      "appointment-late",
    ]);
    expect(findExpectedArrival(arrivals, "patient-grace")?.id).toBe(
      "appointment-late"
    );
    expect(findExpectedArrival(arrivals, "patient-musa")).toBeUndefined();
  });

  it("adds up the figures at the top", () => {
    expect(
      summarizeFrontDesk({
        queues: [
          {
            kind: "TRIAGE",
            departmentId: null,
            departmentName: null,
            resourceId: null,
            resourceName: null,
            waiting: 3,
            called: 1,
            inService: 0,
            longestWaitMinutes: 41,
          },
          {
            kind: "CONSULTATION",
            departmentId: null,
            departmentName: null,
            resourceId: DOCTOR_BELLO,
            resourceName: "Dr Bello",
            waiting: 2,
            called: 0,
            inService: 1,
            longestWaitMinutes: 18,
          },
        ],
        overVisitTarget: 2,
        dayBoard: DAY_BOARD,
      })
    ).toEqual({
      waitingNow: 5,
      longestWaitMinutes: 41,
      overVisitTarget: 2,
      stillToArrive: 2,
    });
    expect(
      summarizeFrontDesk({
        queues: [],
        overVisitTarget: 0,
        dayBoard: undefined,
      }).longestWaitMinutes
    ).toBe(0);
  });

  it.each([
    [0, "0 min"],
    [45, "45 min"],
    [60, "1 h"],
    [80, "1 h 20 min"],
  ])("describes %i minutes as %s", (minutes, expected) => {
    expect(describeMinutes(minutes)).toBe(expected);
  });

  it("helps tell patients with the same name apart", () => {
    const match: PatientMatch = {
      id: "patient-grace",
      patientNumber: "HS-06120",
      folderNumber: null,
      firstName: "Grace",
      lastName: "Okafor",
      middleName: null,
      sex: "female",
      dateOfBirth: "1986-05-12",
      dateOfBirthEstimated: false,
      phone: "+2348121232280",
      isTemporary: false,
      temporaryLabel: null,
    };
    expect(describePatientMatch(match)).toBe(
      "Female · born 12 May 1986 · +2348121232280"
    );
    expect(
      describePatientMatch(
        { ...match, dateOfBirthEstimated: true, phone: null },
        new Date("2026-11-16T09:00:00+01:00")
      )
    ).toBe("Female · about 40 years old");
  });

  it("treats only waiting, called and with-staff entries as live", () => {
    expect(isLiveEntryStatus("CALLED")).toBe(true);
    expect(isLiveEntryStatus("DONE")).toBe(false);
    expect(isLiveEntryStatus("constructor")).toBe(false);
  });
});

describe("highlighting", () => {
  it("marks emergencies red, then urgent patients and long waits amber", () => {
    expect(readFlowEmphasis({ triageBand: "RED", waitState: "GREEN" })).toBe(
      "critical"
    );
    expect(readFlowEmphasis({ triageBand: "YELLOW", waitState: null })).toBe(
      "attention"
    );
    expect(readFlowEmphasis({ triageBand: null, waitState: "RED" })).toBe(
      "attention"
    );
    expect(readFlowEmphasis({ triageBand: "GREEN", waitState: "AMBER" })).toBe(
      "none"
    );
  });

  it("says when a wait is past the target", () => {
    expect(describeWait(42, "RED")).toBe("42 min, over target");
    expect(describeWait(12, "AMBER")).toBe("12 min");
  });
});

describe("patients in the building", () => {
  it("lists the most urgent first, then the longest visits within a band", () => {
    const visits = [
      { token: "W-001", triageBand: null, visitMinutes: 70 },
      { token: "A-001", triageBand: "GREEN", visitMinutes: 64 },
      { token: "W-002", triageBand: "YELLOW", visitMinutes: 52 },
      { token: "W-003", triageBand: "RED", visitMinutes: 9 },
      { token: "A-002", triageBand: "GREEN", visitMinutes: 90 },
    ] as const;
    expect(sortByTriage(visits).map((visit) => visit.token)).toEqual([
      "W-003",
      "W-002",
      "A-002",
      "A-001",
      "W-001",
    ]);
  });
});
