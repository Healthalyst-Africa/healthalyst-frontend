"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  useOrganizationDetailQuery,
  useOrganizationDocumentViewAddressMutation,
  useReviewDecisionMutation,
} from "~/features/organization-oversight/hooks/use-organization-oversight";
import { requestChangesSchema } from "~/features/organization-oversight/schemas/review-schemas";
import { DOCUMENT_VIEW_CONFIGURATION } from "~/features/organization-oversight/config/document-view-configuration";
import type { DocumentViewLinks } from "~/features/organization-oversight/types/organization-details";

import type { ReviewApplicationProperties } from "~/features/organization-oversight/types/review-controller";

export function useOrganizationApplicationDetails({
  application,
  staffIdentity,
}: ReviewApplicationProperties) {
  const detailQuery = useOrganizationDetailQuery(staffIdentity, application.id);
  const decisionMutation = useReviewDecisionMutation(staffIdentity);
  const documentViewAddressMutation =
    useOrganizationDocumentViewAddressMutation();
  const [requestError, setRequestError] = useState("");
  const [documentViewAddresses, setDocumentViewAddresses] =
    useState<DocumentViewLinks>({});

  useEffect(() => {
    const expiryTimes = Object.values(documentViewAddresses).map(
      (documentViewAddress) => documentViewAddress.expiresAt
    );
    if (expiryTimes.length === 0) return;

    const nextExpiryTime = Math.min(...expiryTimes);
    const expiryTimer = window.setTimeout(
      () => {
        const currentTime = Date.now();
        setDocumentViewAddresses((currentDocumentViewAddresses) =>
          Object.fromEntries(
            Object.entries(currentDocumentViewAddresses).filter(
              ([, documentViewAddress]) =>
                documentViewAddress.expiresAt > currentTime
            )
          )
        );
      },
      Math.max(0, nextExpiryTime - Date.now())
    );

    return () => window.clearTimeout(expiryTimer);
  }, [documentViewAddresses]);

  function handleRequestChanges(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = requestChangesSchema.safeParse({
      field: formData.get("field"),
      message: formData.get("message"),
    });
    if (!result.success) {
      setRequestError(
        result.error.issues[0]?.message ?? "Check the requested changes."
      );
      const firstFieldName =
        result.error.issues[0]?.path[0] === "message" ? "message" : "field";
      formElement
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${firstFieldName}"]`
        )
        ?.focus();
      return;
    }
    const detail = detailQuery.data;
    if (!detail) return;
    setRequestError("");
    decisionMutation.mutate(
      {
        organizationId: application.id,
        decision: {
          status: "CHANGES_REQUESTED",
          version: detail.version,
          items: [result.data],
        },
      },
      { onSuccess: () => formElement.reset() }
    );
  }

  async function handleGetDocumentViewAddress(documentId: string) {
    try {
      const documentView = await documentViewAddressMutation.mutateAsync({
        organizationId: application.id,
        documentId,
      });
      setDocumentViewAddresses((currentDocumentViewAddresses) => ({
        ...currentDocumentViewAddresses,
        [documentId]: {
          url: documentView.url,
          expiresAt:
            Date.now() +
            documentView.expiresIn *
              DOCUMENT_VIEW_CONFIGURATION.millisecondsPerSecond,
        },
      }));
    } catch {
      // The request error is shown alongside the document list.
    }
  }

  function clearRequestError() {
    setRequestError("");
  }
  return {
    detailQuery,
    decisionMutation,
    documentViewAddressMutation,
    requestError,
    documentViewAddresses,
    handleRequestChanges,
    handleGetDocumentViewAddress,
    clearRequestError,
  };
}
