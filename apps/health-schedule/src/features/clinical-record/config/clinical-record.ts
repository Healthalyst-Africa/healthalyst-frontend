/** HealthSchedule API paths for notes, problems, diagnoses and the timeline. */
export const CLINICAL_RECORD_ENDPOINTS = {
  patientNotes: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/notes`,
  note: (noteId: string) => `/v1/notes/${encodeURIComponent(noteId)}`,
  signNote: (noteId: string) => `/v1/notes/${encodeURIComponent(noteId)}/sign`,
  noteAddenda: (noteId: string) =>
    `/v1/notes/${encodeURIComponent(noteId)}/addenda`,
  noteEnteredInError: (noteId: string) =>
    `/v1/notes/${encodeURIComponent(noteId)}/entered-in-error`,
  discardNote: (noteId: string) =>
    `/v1/notes/${encodeURIComponent(noteId)}/discard`,
  noteRevisions: (noteId: string) =>
    `/v1/notes/${encodeURIComponent(noteId)}/revisions`,
  noteTemplates: "/v1/note-templates",
  noteTemplate: (templateId: string) =>
    `/v1/note-templates/${encodeURIComponent(templateId)}`,
  timeline: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/timeline`,
  diagnoses: "/v1/diagnoses/icd-11",
  problems: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/problems`,
  problem: (patientId: string, problemId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/problems/${encodeURIComponent(problemId)}`,
  problemEnteredInError: (patientId: string, problemId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/problems/${encodeURIComponent(problemId)}/entered-in-error`,
} as const;

export const CLINICAL_RECORD_PERMISSIONS = {
  /** Read notes, problems, the timeline, templates and diagnoses. */
  readNotes: "note:read",
  /** Doctors' notes and the problem list. */
  writeNotes: "note:write",
  /** Nursing and handover notes. */
  writeNursingNotes: "note:nursing",
  /** Facility note templates are managed with the schedule. */
  manageTemplates: "schedule:manage",
} as const;

export const NOTE_TYPE_OPTIONS = [
  { value: "CONSULTATION", label: "Consultation", writer: "doctor" },
  { value: "WARD_ROUND", label: "Ward round", writer: "doctor" },
  { value: "PROCEDURE", label: "Procedure", writer: "doctor" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge summary", writer: "doctor" },
  { value: "ANTENATAL", label: "Antenatal", writer: "doctor" },
  { value: "NURSING", label: "Nursing", writer: "nurse" },
  { value: "HANDOVER", label: "Handover", writer: "nurse" },
] as const;

/** The built-in template each note type starts from. */
export const DEFAULT_TEMPLATE_BY_NOTE_TYPE = {
  CONSULTATION: "soap",
  WARD_ROUND: "ward_round",
  PROCEDURE: "procedure",
  DISCHARGE_SUMMARY: "discharge_summary",
  ANTENATAL: "antenatal",
  NURSING: "nursing",
  HANDOVER: "sbar_handover",
} as const;

export const NOTE_STATUS_PRESENTATION = {
  DRAFT: { label: "Draft", tone: "highlight" },
  SIGNED: { label: "Signed", tone: "positive" },
  ENTERED_IN_ERROR: { label: "Entered in error", tone: "negative" },
  DISCARDED: { label: "Discarded", tone: "neutral" },
} as const;

export const PROBLEM_STATUS_PRESENTATION = {
  ACTIVE: { label: "Active", tone: "warning" },
  RESOLVED: { label: "Resolved", tone: "neutral" },
  ENTERED_IN_ERROR: { label: "Entered in error", tone: "negative" },
} as const;

export const TIMELINE_KIND_LABELS = {
  VISIT: "Visit",
  TRIAGE: "Triage",
  NOTE: "Note",
  DOCUMENT: "Document",
} as const;

/** Limits the HealthSchedule API applies, so forms can explain them early. */
export const CLINICAL_RECORD_LIMITS = {
  noteTitle: 200,
  sectionText: 20_000,
  sectionLabel: 100,
  sectionHint: 300,
  sectionsMaximum: 20,
  addendum: 5_000,
  errorReasonMinimum: 3,
  errorReasonMaximum: 500,
  problemTitleMinimum: 2,
  problemTitle: 300,
  problemNotes: 2_000,
  templateName: 100,
  diagnosisSearchMinimum: 2,
  diagnosisResults: 20,
  notesPage: 50,
  timelinePage: 50,
} as const;
