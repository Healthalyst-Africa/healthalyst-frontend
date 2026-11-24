import { describe, expect, it } from "vitest";
import type {
  AppointmentType,
  ScheduleCalendar,
} from "~/features/schedule-setup/schemas/schedule-response-schemas";
import {
  filterAppointmentTypes,
  readOfferingCalendarOptions,
} from "~/features/schedule-setup/utilities/appointment-type-filters";

function appointmentType(overrides: Partial<AppointmentType>): AppointmentType {
  return {
    id: "type-1",
    name: "General consultation",
    durationMinutes: 20,
    newPatientDurationMinutes: null,
    bufferMinutes: 0,
    priceKobo: null,
    modality: "IN_PERSON",
    capacity: 1,
    minLeadMinutes: 0,
    maxAdvanceDays: 30,
    dailyCap: null,
    overbookPercent: 0,
    prepNotes: null,
    isActive: true,
    resourceIds: ["calendar-doctor"],
    version: 1,
    ...overrides,
  } as AppointmentType;
}

const TYPES = [
  appointmentType({}),
  appointmentType({
    id: "type-2",
    name: "Antenatal visit",
    resourceIds: ["calendar-midwife"],
  }),
  appointmentType({
    id: "type-3",
    name: "Video follow-up",
    modality: "VIDEO",
    isActive: false,
  }),
];

const NO_FILTERS = { searchText: "", status: "", calendarId: "", modality: "" };

describe("appointment type filters", () => {
  it("narrows by the calendar that offers a type and how it happens", () => {
    const names = (filters: typeof NO_FILTERS) =>
      filterAppointmentTypes(TYPES, filters).map((item) => item.name);
    expect(names({ ...NO_FILTERS, calendarId: "calendar-midwife" })).toEqual([
      "Antenatal visit",
    ]);
    expect(names({ ...NO_FILTERS, modality: "VIDEO" })).toEqual([
      "Video follow-up",
    ]);
    expect(names({ ...NO_FILTERS, status: "active" })).toEqual([
      "Antenatal visit",
      "General consultation",
    ]);
    expect(names({ ...NO_FILTERS, searchText: "consult" })).toEqual([
      "General consultation",
    ]);
  });

  it("offers only calendars that offer a type, by name", () => {
    const calendar = (id: string, name: string) =>
      ({ id, name }) as ScheduleCalendar;
    expect(
      readOfferingCalendarOptions(
        [
          calendar("calendar-room", "Room 2"),
          calendar("calendar-midwife", "Midwife Amina"),
          calendar("calendar-doctor", "Dr Bello"),
        ],
        TYPES
      )
    ).toEqual([
      { value: "calendar-doctor", label: "Dr Bello" },
      { value: "calendar-midwife", label: "Midwife Amina" },
    ]);
  });
});
