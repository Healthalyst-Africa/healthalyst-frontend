"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteOrganizationDocument,
  uploadOrganizationDocument,
} from "~/features/organization-application/services/organization-document-service";
import {
  getOrganizationApplication,
  submitOrganizationApplication,
  updateOrganizationApplication,
} from "~/features/organization-application/services/organization-application-service";

import { ORGANIZATION_APPLICATION_QUERY_KEY } from "~/features/organization-application/config/organization-application";

export function useOrganizationApplicationQuery({
  organizationId,
  userId,
}: {
  organizationId: string | null;
  userId: string;
}) {
  return useQuery({
    queryKey: [ORGANIZATION_APPLICATION_QUERY_KEY, userId, organizationId],
    queryFn: getOrganizationApplication,
    enabled: organizationId !== null,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useOrganizationApplicationUpdateMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityTag,
      changes,
    }: {
      entityTag: string;
      changes: Parameters<typeof updateOrganizationApplication>[1];
    }) => updateOrganizationApplication(entityTag, changes),
    onSuccess: (application) => {
      queryClient.setQueryData(
        [ORGANIZATION_APPLICATION_QUERY_KEY, userId, organizationId],
        application
      );
    },
  });
}

export function useOrganizationDocumentUploadMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadOrganizationDocument,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [ORGANIZATION_APPLICATION_QUERY_KEY, userId, organizationId],
      }),
  });
}

export function useOrganizationDocumentDeleteMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => deleteOrganizationDocument(documentId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [ORGANIZATION_APPLICATION_QUERY_KEY, userId, organizationId],
      }),
  });
}

export function useOrganizationApplicationSubmitMutation({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityTag: string | null | undefined) => {
      if (!entityTag) {
        throw new Error(
          "We could not confirm the latest version of your application. Reload the page and try again."
        );
      }
      return submitOrganizationApplication(entityTag);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [ORGANIZATION_APPLICATION_QUERY_KEY, userId, organizationId],
      }),
  });
}
