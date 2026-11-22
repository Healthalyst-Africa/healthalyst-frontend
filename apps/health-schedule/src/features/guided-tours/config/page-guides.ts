type PageGuide = {
  title: string;
  /** Two or three short paragraphs on what the page shows and does. */
  paragraphs: readonly string[];
};

/** What each HealthSchedule page is for, shown from the help icon. */
export const PAGE_GUIDES = {
  workspace: {
    title: "Overview",
    paragraphs: [
      "Your starting point in HealthSchedule, for the branch shown at the top of the page. Patients today, queues and calendars all belong to that branch.",
      "The pages in the sidebar depend on your role. Team, roles and organisation settings open from the menu under the HealthSchedule name.",
    ],
  },
  frontDesk: {
    title: "Front desk",
    paragraphs: [
      "Reception checks patients in here. Find a patient by name, phone, patient or folder number, or check in someone booked for today as they arrive.",
      "Checking in gives the patient a token and puts them in their first queue. The list of who is in the building shows the most urgent first and updates every few seconds.",
    ],
  },
  triage: {
    title: "Triage and vitals",
    paragraphs: [
      "Nurses record vital signs here and set how urgently each patient should be seen, then send them to their doctor.",
      "For adults, danger signs suggest a triage band as you type. Patients under 16 are left to your judgement. Lowering an emergency band needs the override permission and a reason.",
    ],
  },
  queues: {
    title: "Queues",
    paragraphs: [
      "Staff call patients here from triage, a doctor's queue or a department. Patients are called most urgent first, then in the order they arrived.",
      "From a patient's row you can start seeing them, skip someone who did not come, send them to the next queue or finish their visit. Waits past the target turn amber.",
    ],
  },
  consultation: {
    title: "Consultation",
    paragraphs: [
      "Your queue sits beside the patient you are seeing, with their triage, vital signs and allergies.",
      "Notes stay as drafts, visible only to you, until you sign them. A signed note can be changed for 24 hours; after that, add an addendum.",
    ],
  },
  patients: {
    title: "Patients",
    paragraphs: [
      "Search every patient by name, phone, patient or folder number. Names that sound alike are found too.",
      "Registrations missing details are listed here to complete. With the right permission, you can also see recent merges of duplicate records and undo them.",
    ],
  },
  patientRecord: {
    title: "Patient record",
    paragraphs: [
      "One patient's details, notes, problems, visits, family, consents and documents, in tabs under their name.",
      "Check the name, age and numbers at the top before you record anything. On a restricted record, clinical tabs are locked to anyone outside the care team.",
    ],
  },
  accessReviews: {
    title: "Emergency access reviews",
    paragraphs: [
      "Restricted records, such as HIV or mental health care, are open only to the patient's care team. In an emergency, another clinician can open one for four hours by giving a reason.",
      "Each of those openings is listed here for a manager to review: who opened which record, when, and why. Record whether it was justified, with a note on what you checked.",
      "You cannot review an access you made yourself.",
    ],
  },
  scheduleCalendars: {
    title: "Calendars",
    paragraphs: [
      "Every practitioner, room and piece of equipment that patients book has a calendar here, with its weekly hours at each branch.",
      "Doctors, house officers and midwives get one when they join. A paused calendar keeps its hours but cannot be booked.",
    ],
  },
  scheduleTimeOff: {
    title: "Time off and holidays",
    paragraphs: [
      "Leave, breaks and blocked time close one calendar for a while. Public holidays close a whole branch.",
      "Free slots that overlap time off disappear. Appointments already booked stay.",
    ],
  },
  scheduleAppointmentTypes: {
    title: "Appointment types",
    paragraphs: [
      "What patients book, such as a general consultation, with its length, the gap after it, its price and how far ahead it can be booked.",
      "Each type is offered by the calendars you choose. Switching a type off stops new bookings.",
    ],
  },
  scheduleNoteTemplates: {
    title: "Note templates",
    paragraphs: [
      "The sections clinical notes are written in. Built-in templates, such as SOAP for consultations, cannot be changed.",
      "Add your own for local needs, and switch them off when they are no longer used.",
    ],
  },
} as const satisfies Record<string, PageGuide>;

export type HealthSchedulePage = keyof typeof PAGE_GUIDES;
