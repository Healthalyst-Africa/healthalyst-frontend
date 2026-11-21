"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CLINICAL_RECORD_LIMITS } from "~/features/clinical-record/config/clinical-record";
import type {
  ClinicalNote,
  NoteSection,
  Problem,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import { CLINICAL_RECORD_QUERY_KEYS } from "~/features/clinical-record/services/clinical-record-query-keys";
import {
  addAddendum,
  createNote,
  discardNote,
  getTimeline,
  listNoteRevisions,
  listPatientNotes,
  markNoteEnteredInError,
  signNote,
  updateNote,
  type CreateNoteRequest,
} from "~/features/clinical-record/services/note-service";
import {
  createNoteTemplate,
  listNoteTemplates,
  updateNoteTemplate,
  type NoteTemplateRequest,
} from "~/features/clinical-record/services/note-template-service";
import {
  createProblem,
  listProblems,
  markProblemEnteredInError,
  searchDiagnoses,
  updateProblem,
  type CreateProblemRequest,
  type ProblemChanges,
} from "~/features/clinical-record/services/problem-service";
import { useOrganizationIdentifier } from "~/features/patients/hooks/use-patients";

/** Refreshes everything about one patient's clinical record. */
export function useClinicalRecordInvalidation(patientId: string) {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return () =>
    queryClient.invalidateQueries({
      queryKey: CLINICAL_RECORD_QUERY_KEYS.patient(
        organizationIdentifier,
        patientId
      ),
    });
}

/**
 * Signed notes and the reader's drafts, newest first, in pages. With a
 * visit, only that visit's notes.
 */
export function usePatientNotes(
  patientId: string,
  options: { visitId?: string; isEnabled: boolean }
) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useInfiniteQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.notes(
      organizationIdentifier,
      patientId,
      options.visitId ?? "all"
    ),
    queryFn: ({ pageParam }) =>
      listPatientNotes(patientId, {
        visitId: options.visitId,
        before: pageParam ?? undefined,
        limit: CLINICAL_RECORD_LIMITS.notesPage,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextBefore,
    enabled: options.isEnabled,
  });
}

export function useNoteRevisions(note: ClinicalNote, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.revisions(
      organizationIdentifier,
      note.patientId,
      note.id
    ),
    queryFn: () => listNoteRevisions(note.id),
    enabled: isEnabled,
  });
}

/** Saving, signing, addenda and corrections for one patient's notes. */
export function useNoteActions(patientId: string) {
  const invalidateRecord = useClinicalRecordInvalidation(patientId);
  return {
    create: useMutation({
      mutationFn: (request: CreateNoteRequest) =>
        createNote(patientId, request),
      onSuccess: invalidateRecord,
    }),
    update: useMutation({
      mutationFn: ({
        note,
        changes,
      }: {
        note: Pick<ClinicalNote, "id" | "version">;
        changes: { title?: string | null; sections: NoteSection[] };
      }) => updateNote(note, changes),
      onSuccess: invalidateRecord,
    }),
    sign: useMutation({
      mutationFn: (noteId: string) => signNote(noteId),
      onSuccess: invalidateRecord,
    }),
    discard: useMutation({
      mutationFn: (noteId: string) => discardNote(noteId),
      onSuccess: invalidateRecord,
    }),
    addAddendum: useMutation({
      mutationFn: ({ noteId, text }: { noteId: string; text: string }) =>
        addAddendum(noteId, text),
      onSuccess: invalidateRecord,
    }),
    markEnteredInError: useMutation({
      mutationFn: ({ noteId, reason }: { noteId: string; reason: string }) =>
        markNoteEnteredInError(noteId, reason),
      onSuccess: invalidateRecord,
    }),
  };
}

export function useTimeline(patientId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useInfiniteQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.timeline(
      organizationIdentifier,
      patientId
    ),
    queryFn: ({ pageParam }) =>
      getTimeline(patientId, {
        before: pageParam ?? undefined,
        limit: CLINICAL_RECORD_LIMITS.timelinePage,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextBefore,
    enabled: isEnabled,
  });
}

export function useNoteTemplates(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.templates(organizationIdentifier),
    queryFn: listNoteTemplates,
    enabled: isEnabled,
    // Templates change rarely; a note editor opened often reuses them.
    staleTime: 5 * 60_000,
  });
}

export function useSaveNoteTemplate() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return useMutation({
    mutationFn: ({
      template,
      request,
    }: {
      /** Empty for a new template. */
      template: { id: string; version: number } | null;
      request: NoteTemplateRequest;
    }) =>
      template
        ? updateNoteTemplate(template, request)
        : createNoteTemplate(request),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: CLINICAL_RECORD_QUERY_KEYS.templates(organizationIdentifier),
      }),
  });
}

export function useDiagnosisSearch(searchText: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.diagnoses(
      organizationIdentifier,
      searchText
    ),
    queryFn: () => searchDiagnoses(searchText),
    enabled: isEnabled,
    staleTime: 10 * 60_000,
  });
}

export function useProblems(patientId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.problems(
      organizationIdentifier,
      patientId
    ),
    queryFn: () => listProblems(patientId),
    enabled: isEnabled,
  });
}

export function useProblemActions(patientId: string) {
  const invalidateRecord = useClinicalRecordInvalidation(patientId);
  return {
    create: useMutation({
      mutationFn: (request: CreateProblemRequest) =>
        createProblem(patientId, request),
      onSuccess: invalidateRecord,
    }),
    update: useMutation({
      mutationFn: ({
        problem,
        changes,
      }: {
        problem: Problem;
        changes: ProblemChanges;
      }) => updateProblem(problem, changes),
      onSuccess: invalidateRecord,
    }),
    markEnteredInError: useMutation({
      mutationFn: ({ problem, reason }: { problem: Problem; reason: string }) =>
        markProblemEnteredInError(problem, reason),
      onSuccess: invalidateRecord,
    }),
  };
}
