/**
 * Query keys for one patient's clinical record. Everything about a patient
 * sits under one prefix, so opening a restricted record or signing a note
 * refreshes the notes, problems, timeline and access together.
 */
export const CLINICAL_RECORD_QUERY_KEYS = {
  patient: (organizationId: string, patientId: string) =>
    ["health-schedule", organizationId, "clinical", patientId] as const,
  notes: (organizationId: string, patientId: string, visitId: string) =>
    [
      "health-schedule",
      organizationId,
      "clinical",
      patientId,
      "notes",
      visitId,
    ] as const,
  revisions: (organizationId: string, patientId: string, noteId: string) =>
    [
      "health-schedule",
      organizationId,
      "clinical",
      patientId,
      "revisions",
      noteId,
    ] as const,
  problems: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "clinical",
      patientId,
      "problems",
    ] as const,
  timeline: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "clinical",
      patientId,
      "timeline",
    ] as const,
  sensitivity: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "clinical",
      patientId,
      "sensitivity",
    ] as const,
  templates: (organizationId: string) =>
    ["health-schedule", organizationId, "note-templates"] as const,
  diagnoses: (organizationId: string, searchText: string) =>
    ["health-schedule", organizationId, "diagnoses", searchText] as const,
  accessGrants: (organizationId: string, onlyUnreviewed: boolean) =>
    [
      "health-schedule",
      organizationId,
      "emergency-access",
      onlyUnreviewed ? "unreviewed" : "all",
    ] as const,
};
