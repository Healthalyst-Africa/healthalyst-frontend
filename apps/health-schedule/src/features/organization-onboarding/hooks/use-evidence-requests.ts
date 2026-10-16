"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationStatusQueryKeys } from "../api/application-status-query-keys";
import {
  getMyEvidenceRequests,
  submitEvidenceDocument,
  type SessionResponse,
} from "../api/accounts-service";

export function useMyEvidenceRequestsQuery(
  sessionIdentifier: string | null,
  session: SessionResponse | null
) {
  return useQuery({
    queryKey: applicationStatusQueryKeys.evidenceRequests(
      sessionIdentifier ?? "no-session"
    ),
    queryFn: () => {
      if (!session) throw new Error("Sign in to view requested evidence.");
      return getMyEvidenceRequests(session);
    },
    enabled: session !== null,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSubmitEvidenceDocumentMutation(
  session: SessionResponse | null,
  sessionIdentifier: string | null
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (upload: { requestId: string; file: File }) => {
      if (!session) throw new Error("Sign in to upload requested evidence.");
      return submitEvidenceDocument(session, upload.requestId, upload.file);
    },
    onSuccess: async () => {
      if (sessionIdentifier) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey:
              applicationStatusQueryKeys.evidenceRequests(sessionIdentifier),
          }),
          queryClient.invalidateQueries({
            queryKey: applicationStatusQueryKeys.application(sessionIdentifier),
          }),
        ]);
      }
    },
  });
}
