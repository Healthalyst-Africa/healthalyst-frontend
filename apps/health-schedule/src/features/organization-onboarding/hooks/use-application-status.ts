"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { applicationStatusQueryKeys } from "../api/application-status-query-keys";
import {
  createSession,
  getMyApplication,
  type SessionResponse,
} from "../api/accounts-service";

export type ActiveSession = {
  identifier: string;
  response: SessionResponse;
};

export function useCreateSessionMutation() {
  return useMutation({ mutationFn: createSession });
}

export function useMyApplicationQuery(session: ActiveSession | null) {
  return useQuery({
    queryKey: applicationStatusQueryKeys.application(
      session?.identifier ?? "no-session"
    ),
    queryFn: () => {
      if (!session) throw new Error("Sign in to view your application.");
      return getMyApplication(session.response);
    },
    enabled: session !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}
