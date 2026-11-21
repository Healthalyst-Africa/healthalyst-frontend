import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { CLINICAL_RECORD_ENDPOINTS } from "~/features/clinical-record/config/clinical-record";
import {
  clinicalNoteListSchema,
  clinicalNoteSchema,
  noteRevisionListSchema,
  timelineSchema,
  type ClinicalNote,
  type ClinicalNoteList,
  type NoteRevision,
  type NoteSection,
  type NoteType,
  type Timeline,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export type CreateNoteRequest = {
  /** Chosen by the browser, so a retried save never makes two notes. */
  id: string;
  type: NoteType;
  visitId?: string;
  templateId?: string;
  title?: string;
  sections: NoteSection[];
};

/** Signed notes and the reader's own drafts, newest first. Requires `note:read`. */
export async function listPatientNotes(
  patientId: string,
  options: { visitId?: string; before?: string; limit: number }
): Promise<ClinicalNoteList> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      CLINICAL_RECORD_ENDPOINTS.patientNotes(patientId),
      {
        params: {
          includeErrors: "true",
          limit: options.limit,
          ...(options.visitId && { visitId: options.visitId }),
          ...(options.before && { before: options.before }),
        },
      }
    );
    return parseHealthScheduleResponse(
      clinicalNoteListSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the notes.");
  }
}

export async function getNote(noteId: string): Promise<ClinicalNote> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      CLINICAL_RECORD_ENDPOINTS.note(noteId)
    );
    return parseHealthScheduleResponse(
      clinicalNoteSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not open the note.");
  }
}

/** Starts a draft only its author sees. Doctors' types need `note:write`, nursing types `note:nursing`. */
export async function createNote(
  patientId: string,
  request: CreateNoteRequest
): Promise<ClinicalNote> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      CLINICAL_RECORD_ENDPOINTS.patientNotes(patientId),
      request
    );
    return parseHealthScheduleResponse(
      clinicalNoteSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save the note.");
  }
}

/**
 * Saves a draft, or the author's signed note within 24 hours of signing.
 * The version guards against overwriting a change made elsewhere.
 */
export async function updateNote(
  note: Pick<ClinicalNote, "id" | "version">,
  changes: { title?: string | null; sections: NoteSection[] }
): Promise<ClinicalNote> {
  try {
    const response = await getHealthScheduleHttpClient().patch<unknown>(
      CLINICAL_RECORD_ENDPOINTS.note(note.id),
      changes,
      { headers: { "If-Match": toEntityTag(note.version) } }
    );
    return parseHealthScheduleResponse(
      clinicalNoteSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save the note.");
  }
}

async function postNoteAction(
  path: string,
  body: object | undefined,
  fallbackMessage: string
): Promise<ClinicalNote> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      path,
      body
    );
    return parseHealthScheduleResponse(
      clinicalNoteSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, fallbackMessage);
  }
}

/** The author signs; at least one section needs text. */
export function signNote(noteId: string) {
  return postNoteAction(
    CLINICAL_RECORD_ENDPOINTS.signNote(noteId),
    undefined,
    "We could not sign the note."
  );
}

export function addAddendum(noteId: string, text: string) {
  return postNoteAction(
    CLINICAL_RECORD_ENDPOINTS.noteAddenda(noteId),
    { text },
    "We could not add the addendum."
  );
}

/** The author marks a signed note wrong; it stays, struck through. */
export function markNoteEnteredInError(noteId: string, reason: string) {
  return postNoteAction(
    CLINICAL_RECORD_ENDPOINTS.noteEnteredInError(noteId),
    { reason },
    "We could not mark the note as entered in error."
  );
}

/** Throws away the author's draft. */
export async function discardNote(noteId: string): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      CLINICAL_RECORD_ENDPOINTS.discardNote(noteId)
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not discard the draft.");
  }
}

/** Earlier versions of a note edited after it was signed. */
export async function listNoteRevisions(
  noteId: string
): Promise<NoteRevision[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      CLINICAL_RECORD_ENDPOINTS.noteRevisions(noteId)
    );
    return parseHealthScheduleResponse(
      noteRevisionListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load earlier versions.");
  }
}

/** Visits, triage, notes and documents, newest first. Requires `note:read`. */
export async function getTimeline(
  patientId: string,
  options: { before?: string; limit: number }
): Promise<Timeline> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      CLINICAL_RECORD_ENDPOINTS.timeline(patientId),
      {
        params: {
          limit: options.limit,
          ...(options.before && { before: options.before }),
        },
      }
    );
    return parseHealthScheduleResponse(
      timelineSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the timeline.");
  }
}
