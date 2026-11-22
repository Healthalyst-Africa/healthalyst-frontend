import type { GuidedTourStep } from "@healthalyst/ui/types/guided-tour";
import type { HealthSchedulePage } from "~/features/guided-tours/config/page-guides";

function anchor(name: string): string {
  return `[data-tour="${name}"]`;
}

/** The tours, each a few short steps. Steps whose element is hidden are skipped. */
export const GUIDED_TOURS = {
  workspace: {
    name: "the workspace",
    steps: [
      {
        title: "Welcome to HealthSchedule",
        description:
          "A quick look at where things are. It takes under a minute, and you can leave at any time with Escape.",
      },
      {
        element: anchor("shell-navigation"),
        title: "Your pages",
        description:
          "Everything you can do is here. You see the pages your role allows, so a colleague's sidebar may differ from yours.",
        placement: "right",
      },
      {
        element: anchor("shell-toolbar"),
        title: "The branch you work at",
        description:
          "Patient visits, queues and calendars belong to a branch. Change it here when you move between branches.",
        placement: "bottom",
      },
      {
        element: anchor("shell-brand"),
        title: "Other apps and your organisation",
        description:
          "Switch to another HealthAlyst app or organisation, and open team and organisation settings.",
        placement: "right",
      },
      {
        element: anchor("page-help"),
        title: "Help on every page",
        description:
          "This button explains whichever page you are on, and offers a tour where there is one.",
        placement: "bottom",
      },
    ],
  },
  frontDesk: {
    name: "the front desk",
    steps: [
      {
        element: anchor("front-desk-check-in"),
        title: "Check a patient in",
        description:
          "Search by name, phone, patient or folder number. Names that sound alike are found too.",
        placement: "bottom",
      },
      {
        element: anchor("front-desk-bookings"),
        title: "Today's bookings",
        description:
          "Patients booked for today who have not arrived yet. Check them in from here when they do.",
        placement: "top",
      },
      {
        element: anchor("page-actions"),
        title: "New patients",
        description:
          "Register someone who is not on the system yet, or someone whose name is not known yet, such as a patient brought in unconscious.",
        placement: "bottom",
      },
      {
        element: anchor("front-desk-in-building"),
        title: "Who is in the building",
        description:
          "Everyone checked in and not yet finished, the most urgent first. It updates on its own.",
        placement: "top",
      },
    ],
  },
  queues: {
    name: "the queues",
    steps: [
      {
        element: anchor("queue-choice"),
        title: "Choose a queue",
        description:
          "Vital signs, a doctor or a department, grouped by who serves them. The number waiting is shown beside each.",
        placement: "bottom",
      },
      {
        element: anchor("queue-call-next"),
        title: "Call the next patient",
        description:
          "Calls whoever should be seen next: the most urgent first, then whoever came first.",
        placement: "bottom",
      },
      {
        element: anchor("queue-list"),
        title: "The queue",
        description:
          "Open a patient to call them by name, start seeing them, send them on or finish their visit.",
        placement: "top",
      },
    ],
  },
  triage: {
    name: "triage",
    steps: [
      {
        element: anchor("triage-waiting"),
        title: "Waiting for vital signs",
        description:
          "Patients who need vital signs taken, the most urgent first. Choose one to record their vital signs.",
        placement: "right",
      },
      {
        title: "Danger signs and the band",
        description:
          "As you enter vital signs, danger signs show straight away and suggest a band for adults. Saving sends the patient to their doctor.",
      },
    ],
  },
  consultation: {
    name: "the consultation",
    steps: [
      {
        element: anchor("consultation-queue"),
        title: "Your queue",
        description:
          "Your own patients open first. Switch to the shared doctors' queue or a colleague's here.",
        placement: "right",
      },
      {
        element: anchor("consultation-call-next"),
        title: "Call the next patient",
        description: "Calls the most urgent, then whoever has waited longest.",
        placement: "right",
      },
      {
        element: anchor("consultation-patient"),
        title: "The patient you are seeing",
        description:
          "Vital signs and allergies sit beside the consultation note. Sign the note and record diagnoses before you finish the visit.",
        placement: "left",
      },
    ],
  },
  patients: {
    name: "patient records",
    steps: [
      {
        element: anchor("patients-search"),
        title: "Find a patient",
        description:
          "Search by name, phone, patient or folder number, then open their record.",
        placement: "bottom",
      },
    ],
  },
  patientRecord: {
    name: "the patient record",
    steps: [
      {
        element: anchor("patient-banner"),
        title: "Who this is",
        description:
          "Name, age, numbers, cover and allergies, so you can check you have the right patient.",
        placement: "bottom",
      },
      {
        element: anchor("patient-sections"),
        title: "The record",
        description:
          "Notes, problems and the timeline sit beside family, consents and documents. Restricted records show a lock to people outside the care team.",
        placement: "top",
      },
    ],
  },
} as const satisfies Partial<
  Record<HealthSchedulePage, { name: string; steps: readonly GuidedTourStep[] }>
>;

export type GuidedTourName = keyof typeof GUIDED_TOURS;

export function hasGuidedTour(
  page: HealthSchedulePage
): page is GuidedTourName {
  return page in GUIDED_TOURS;
}

/** Browser storage name for the one-time tour offer, per person. */
export const TOUR_OFFER_STORAGE_PREFIX = "healthschedule-tour-offer";
