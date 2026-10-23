"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmOrganizationDocumentUpload,
  deleteOrganizationDocument,
  getOrganizationApplication,
  requestOrganizationDocumentUpload,
  submitOrganizationApplication,
  updateOrganizationApplication,
  uploadOrganizationDocumentFile,
  type OrganizationDocumentType,
} from "../api/platform-application-service";

export const ORGANIZATION_APPLICATION_QUERY_KEY = "organization-application";

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
    mutationFn: async ({
      type,
      documentFile,
      expiresOn,
    }: {
      type: OrganizationDocumentType;
      documentFile: File;
      expiresOn?: string;
    }) => {
      const contentType = documentFile.type;
      if (
        contentType !== "application/pdf" &&
        contentType !== "image/jpeg" &&
        contentType !== "image/png"
      ) {
        throw new Error("Choose a PDF, JPEG, or PNG document.");
      }
      const uploadRequest = await requestOrganizationDocumentUpload({
        type,
        fileName: documentFile.name,
        contentType,
        sizeBytes: documentFile.size,
      });
      await uploadOrganizationDocumentFile(
        uploadRequest.uploadUrl,
        uploadRequest.headers,
        documentFile
      );
      return confirmOrganizationDocumentUpload(
        uploadRequest.documentId,
        expiresOn
      );
    },
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
    mutationFn: (entityTag: string) => submitOrganizationApplication(entityTag),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [ORGANIZATION_APPLICATION_QUERY_KEY, userId, organizationId],
      }),
  });
}
