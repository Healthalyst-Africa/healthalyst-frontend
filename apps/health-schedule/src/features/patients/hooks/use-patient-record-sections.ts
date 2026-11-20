"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  usePatientInvalidation,
  useOrganizationIdentifier,
} from "~/features/patients/hooks/use-patients";
import {
  getConsents,
  recordConsent,
  revokeConsent,
} from "~/features/patients/services/consent-service";
import {
  getDocumentLink,
  listDocuments,
  removeDocument,
  uploadDocument,
} from "~/features/patients/services/document-service";
import {
  getMergePreview,
  listDuplicates,
  listMerges,
  mergePatients,
  undoMerge,
} from "~/features/patients/services/merge-service";
import { PATIENT_QUERY_KEYS } from "~/features/patients/services/patient-service";
import {
  addRelationship,
  endRelationship,
  listRelationships,
} from "~/features/patients/services/relationship-service";

export function useRelationships(patientId: string, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.relationships(
      organizationIdentifier,
      patientId
    ),
    queryFn: () => listRelationships(patientId),
    enabled: isEnabled,
  });
}

export function useRelationshipActions(patientId: string) {
  const invalidatePatients = usePatientInvalidation();
  const options = { onSettled: invalidatePatients };
  return {
    add: useMutation({
      mutationFn: (request: Record<string, unknown>) =>
        addRelationship(patientId, request),
      ...options,
    }),
    end: useMutation({
      mutationFn: (relationshipId: string) =>
        endRelationship(patientId, relationshipId),
      ...options,
    }),
  };
}

export function useConsents(patientId: string, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.consents(organizationIdentifier, patientId),
    queryFn: () => getConsents(patientId),
    enabled: isEnabled,
  });
}

/** Consent to reminders also changes the banner's messaging line. */
export function useConsentActions(patientId: string) {
  const invalidatePatients = usePatientInvalidation();
  const options = { onSettled: invalidatePatients };
  return {
    record: useMutation({
      mutationFn: (request: Record<string, unknown>) =>
        recordConsent(patientId, request),
      ...options,
    }),
    revoke: useMutation({
      mutationFn: ({
        consentId,
        reason,
      }: {
        consentId: string;
        reason: string;
      }) => revokeConsent(patientId, consentId, reason),
      ...options,
    }),
  };
}

export function useDocuments(patientId: string, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.documents(organizationIdentifier, patientId),
    queryFn: () => listDocuments(patientId),
    enabled: isEnabled,
  });
}

export function useDocumentActions(patientId: string) {
  const invalidatePatients = usePatientInvalidation();
  const options = { onSettled: invalidatePatients };
  return {
    upload: useMutation({
      mutationFn: (
        upload: Omit<Parameters<typeof uploadDocument>[0], "patientId">
      ) => uploadDocument({ patientId, ...upload }),
      ...options,
    }),
    /** Links last five minutes, so each opening asks for a new one. */
    open: useMutation({
      mutationFn: (documentId: string) =>
        getDocumentLink(patientId, documentId),
    }),
    remove: useMutation({
      mutationFn: ({
        documentId,
        reason,
      }: {
        documentId: string;
        reason: string;
      }) => removeDocument(patientId, documentId, reason),
      ...options,
    }),
  };
}

/**
 * Opens a fresh five-minute link in a new tab. The tab is opened before the
 * request so the browser does not treat it as an unwanted pop-up.
 */
export function useOpenDocument(patientId: string) {
  const { open } = useDocumentActions(patientId);
  return {
    mutation: open,
    openDocument: (documentId: string) => {
      const documentWindow = window.open("about:blank", "_blank");
      if (documentWindow) documentWindow.opener = null;
      open.mutate(documentId, {
        onSuccess: (url) => {
          if (documentWindow) documentWindow.location.href = url;
          else window.location.assign(url);
        },
        onError: () => documentWindow?.close(),
      });
    },
  };
}

export function useDuplicates(patientId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.duplicates(organizationIdentifier, patientId),
    queryFn: () => listDuplicates(patientId),
    enabled: isEnabled,
  });
}

/** Always fresh: the versions it returns are the ones the merge must match. */
export function useMergePreview(
  survivorId: string,
  mergedId: string,
  isEnabled: boolean
) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.mergePreview(
      organizationIdentifier,
      survivorId,
      mergedId
    ),
    queryFn: () => getMergePreview(survivorId, mergedId),
    enabled: isEnabled && survivorId !== "" && mergedId !== "",
    staleTime: 0,
    gcTime: 0,
  });
}

export function useMerges(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.merges(organizationIdentifier),
    queryFn: listMerges,
    enabled: isEnabled,
  });
}

export function useMergeActions() {
  const invalidatePatients = usePatientInvalidation();
  const options = { onSettled: invalidatePatients };
  return {
    merge: useMutation({ mutationFn: mergePatients, ...options }),
    undo: useMutation({
      mutationFn: ({ mergeId, reason }: { mergeId: string; reason: string }) =>
        undoMerge(mergeId, reason),
      ...options,
    }),
  };
}
