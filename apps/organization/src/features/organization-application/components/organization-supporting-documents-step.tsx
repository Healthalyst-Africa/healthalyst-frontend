"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@healthalyst/icons";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FileUploadField } from "@healthalyst/ui/components/file-upload-field";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { DocumentDropIllustration } from "@healthalyst/ui/illustrations/document-drop-illustration";
import { formatFileSize } from "@healthalyst/ui/lib/file-size";
import {
  useOrganizationDocumentDeleteMutation,
  useOrganizationDocumentUploadMutation,
} from "~/features/organization-application/hooks/use-organization-application";
import { DOCUMENT_UPLOAD_CONFIGURATION } from "~/features/organization-application/config/document-upload";
import {
  DOCUMENT_CONTENT_TYPE_LABELS,
  DOCUMENT_STATUS_PRESENTATION,
  DOCUMENT_TYPE_HINTS,
  DOCUMENT_TYPE_LABELS,
  PENDING_DOCUMENT_STATUSES,
} from "~/features/organization-application/config/document-presentation";
import type {
  OrganizationApplication,
  OrganizationDocumentType,
} from "~/features/organization-application/types/organization-application";

export function OrganizationSupportingDocumentsStep({
  application,
  organizationId,
  userId,
  reloadApplication,
  onBack,
  onContinue,
}: {
  application: OrganizationApplication;
  organizationId: string;
  userId: string;
  reloadApplication: () => Promise<OrganizationApplication | undefined>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [documentErrors, setDocumentErrors] = useState<
    Partial<Record<OrganizationDocumentType, string>>
  >({});
  const [refreshError, setRefreshError] = useState("");
  // Thumbnails for images uploaded in this visit, by document; the Platform
  // API does not offer applicants a view link, so these end with the visit.
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsReference = useRef(previewUrls);
  const uploadMutation = useOrganizationDocumentUploadMutation({
    organizationId,
    userId,
  });
  const deleteMutation = useOrganizationDocumentDeleteMutation({
    organizationId,
    userId,
  });
  // Tracked per document so several uploads and removals can run at once.
  const [uploadingFileNames, setUploadingFileNames] = useState<
    Partial<Record<OrganizationDocumentType, string>>
  >({});
  const [removingDocumentIdentifiers, setRemovingDocumentIdentifiers] =
    useState<string[]>([]);
  const hasPendingDocuments = application.documents.some((document) =>
    PENDING_DOCUMENT_STATUSES.includes(document.status)
  );

  useEffect(() => {
    previewUrlsReference.current = previewUrls;
  }, [previewUrls]);

  useEffect(
    () => () => {
      Object.values(previewUrlsReference.current).forEach((previewUrl) =>
        URL.revokeObjectURL(previewUrl)
      );
    },
    []
  );

  const reloadApplicationReference = useRef(reloadApplication);
  useEffect(() => {
    reloadApplicationReference.current = reloadApplication;
  }, [reloadApplication]);

  // Uploads are scanned on the server; keep checking until each one settles.
  useEffect(() => {
    if (!hasPendingDocuments) return;
    const refreshTimer = window.setInterval(() => {
      reloadApplicationReference.current().then(
        () => setRefreshError(""),
        () =>
          setRefreshError(
            "We could not check your document status. We will try again shortly."
          )
      );
    }, DOCUMENT_UPLOAD_CONFIGURATION.statusRefreshIntervalMilliseconds);
    return () => window.clearInterval(refreshTimer);
  }, [hasPendingDocuments]);

  function setDocumentError(
    documentType: OrganizationDocumentType,
    message: string
  ) {
    setDocumentErrors((currentErrors) => ({
      ...currentErrors,
      [documentType]: message,
    }));
  }

  async function uploadDocument(
    documentType: OrganizationDocumentType,
    documentFile: File
  ) {
    setDocumentError(documentType, "");
    setUploadingFileNames((currentFileNames) => ({
      ...currentFileNames,
      [documentType]: documentFile.name,
    }));
    try {
      const replacedDocumentIdentifiers = application.documents
        .filter((document) => document.type === documentType)
        .map((document) => document.id);
      const uploadedDocument = await uploadMutation.mutateAsync({
        type: documentType,
        documentFile,
      });
      // A new file for a document replaces the earlier ones.
      for (const replacedDocumentIdentifier of replacedDocumentIdentifiers) {
        await deleteMutation.mutateAsync(replacedDocumentIdentifier);
        setPreviewUrls((currentPreviewUrls) => {
          const {
            [replacedDocumentIdentifier]: replacedPreviewUrl,
            ...remainingPreviewUrls
          } = currentPreviewUrls;
          if (replacedPreviewUrl) URL.revokeObjectURL(replacedPreviewUrl);
          return remainingPreviewUrls;
        });
      }
      if (documentFile.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(documentFile);
        setPreviewUrls((currentPreviewUrls) => ({
          ...currentPreviewUrls,
          [uploadedDocument.id]: previewUrl,
        }));
      }
    } catch (error) {
      setDocumentError(
        documentType,
        error instanceof Error
          ? error.message
          : "We could not upload that document. Try again."
      );
    } finally {
      setUploadingFileNames((currentFileNames) => {
        const { [documentType]: finishedFileName, ...remainingFileNames } =
          currentFileNames;
        return finishedFileName === undefined
          ? currentFileNames
          : remainingFileNames;
      });
    }
  }

  async function removeDocument(
    documentType: OrganizationDocumentType,
    documentId: string
  ) {
    setDocumentError(documentType, "");
    setRemovingDocumentIdentifiers((currentIdentifiers) => [
      ...currentIdentifiers,
      documentId,
    ]);
    try {
      await deleteMutation.mutateAsync(documentId);
      setPreviewUrls((currentPreviewUrls) => {
        const { [documentId]: removedPreviewUrl, ...remainingPreviewUrls } =
          currentPreviewUrls;
        if (removedPreviewUrl) URL.revokeObjectURL(removedPreviewUrl);
        return remainingPreviewUrls;
      });
    } catch (error) {
      setDocumentError(
        documentType,
        error instanceof Error
          ? error.message
          : "We could not remove that document. Try again."
      );
    } finally {
      setRemovingDocumentIdentifiers((currentIdentifiers) =>
        currentIdentifiers.filter((identifier) => identifier !== documentId)
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {refreshError && (
        <NoticeBanner tone="error" title="Document status not updated">
          {refreshError}
        </NoticeBanner>
      )}

      <ContentPanel elevation="flat" spacing="compact" contentClassName="gap-6">
        {application.checklist.documentsComplete && (
          <StateNotice
            tone="success"
            illustration={<DocumentsCompleteIllustration />}
            title="All required documents are in"
          >
            Add optional documents if you have them, or continue to review.
          </StateNotice>
        )}

        {application.requiredDocuments.length === 0 ? (
          !application.checklist.documentsComplete && (
            <StateNotice
              tone="warning"
              title="Document requirements are not available yet"
            >
              Reload the page to get the current document requirements.
            </StateNotice>
          )
        ) : (
          <ul className="flex flex-col gap-8">
            {application.requiredDocuments.map((requirement) => {
              const documentTypeLabel = DOCUMENT_TYPE_LABELS[requirement.type];

              return (
                <li key={requirement.type}>
                  <FileUploadField
                    identifier={`document-${requirement.type}`}
                    label={documentTypeLabel}
                    required={requirement.required}
                    hint={DOCUMENT_TYPE_HINTS[requirement.type]}
                    accept={DOCUMENT_UPLOAD_CONFIGURATION.acceptedFileTypes}
                    maximumSizeBytes={
                      DOCUMENT_UPLOAD_CONFIGURATION.maximumSizeBytes
                    }
                    formatsDescription={
                      DOCUMENT_UPLOAD_CONFIGURATION.formatsDescription
                    }
                    illustration={<DocumentDropIllustration />}
                    files={application.documents
                      .filter((document) => document.type === requirement.type)
                      .map((document) => {
                        const statusPresentation =
                          DOCUMENT_STATUS_PRESENTATION[document.status];
                        return {
                          identifier: document.id,
                          fileName: document.fileName,
                          fileTypeLabel:
                            DOCUMENT_CONTENT_TYPE_LABELS[document.contentType],
                          details: formatFileSize(document.sizeBytes),
                          previewUrl: previewUrls[document.id],
                          status: {
                            label: statusPresentation.label,
                            tone: statusPresentation.tone,
                          },
                          message: statusPresentation.message,
                          onRemove: application.canEdit
                            ? () =>
                                void removeDocument(
                                  requirement.type,
                                  document.id
                                )
                            : undefined,
                          isRemoving: removingDocumentIdentifiers.includes(
                            document.id
                          ),
                        };
                      })}
                    canAddFile={application.canEdit}
                    uploadingFileName={uploadingFileNames[requirement.type]}
                    error={documentErrors[requirement.type]}
                    onFileAccepted={(documentFile) =>
                      void uploadDocument(requirement.type, documentFile)
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
          <a
            href="#onboarding-content"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={(clickEvent) => {
              clickEvent.preventDefault();
              onBack();
            }}
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4 shrink-0" />
            Back to account verification
          </a>
          <a
            href="#onboarding-content"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={(clickEvent) => {
              clickEvent.preventDefault();
              onContinue();
            }}
          >
            Continue to review
            <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </div>
      </ContentPanel>
    </div>
  );
}
