"use client";

import { useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@healthalyst/ui/components/alert";
import { Badge } from "@healthalyst/ui/components/badge";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import { Field, FieldLabel } from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import {
  useOrganizationDocumentDeleteMutation,
  useOrganizationDocumentUploadMutation,
} from "~/features/organization-application/hooks/use-organization-application";
import { DOCUMENT_UPLOAD_CONFIGURATION } from "~/features/organization-application/config/document-upload";
import type {
  OrganizationApplication,
  OrganizationDocumentType,
} from "~/features/organization-application/types/organization-application";

const DOCUMENT_TYPE_LABELS: Record<OrganizationDocumentType, string> = {
  CAC_CERTIFICATE: "CAC certificate",
  FACILITY_LICENCE: "Facility licence",
  MEDICAL_DIRECTOR_LICENCE: "Medical director licence",
  MLSCN_LICENCE: "Medical laboratory licence",
  PCN_PREMISES_LICENCE: "Pharmacy premises licence",
  NHIA_ACCREDITATION: "NHIA accreditation",
  PROOF_OF_ADDRESS: "Proof of address",
  OTHER: "Other supporting document",
};

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
  const [actionError, setActionError] = useState("");
  const uploadMutation = useOrganizationDocumentUploadMutation({
    organizationId,
    userId,
  });
  const deleteMutation = useOrganizationDocumentDeleteMutation({
    organizationId,
    userId,
  });
  const isWorking = uploadMutation.isPending || deleteMutation.isPending;

  async function uploadDocument(
    documentType: OrganizationDocumentType,
    documentFile: File
  ) {
    setActionError("");
    uploadMutation.reset();
    try {
      await uploadMutation.mutateAsync({
        type: documentType,
        documentFile,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "We could not upload that document. Try again."
      );
    }
  }

  async function removeDocument(documentId: string) {
    setActionError("");
    deleteMutation.reset();
    try {
      await deleteMutation.mutateAsync(documentId);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "We could not remove that document. Try again."
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-normal">Supporting documents</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Upload the registration and facility documents requested for your
          organisation.
        </p>
      </div>

      <Alert>
        <AlertTitle>Upload organisation documents only</AlertTitle>
        <AlertDescription>
          Do not upload patient records or medical information. Accepted files
          are PDF, JPEG or PNG, up to 10 MB each.
        </AlertDescription>
      </Alert>

      {actionError && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Document update failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-none">
        <CardContent className="flex flex-col gap-6 p-5 sm:p-8">
          {application.requiredDocuments.length === 0 ? (
            <Alert>
              <AlertTitle>
                {application.checklist.documentsComplete
                  ? "No supporting documents are required"
                  : "Document requirements are not available yet"}
              </AlertTitle>
              <AlertDescription>
                {application.checklist.documentsComplete
                  ? "You can continue to the final review."
                  : "Reload the application to get the current document requirements."}
              </AlertDescription>
            </Alert>
          ) : (
            <ul className="flex flex-col gap-5">
              {application.requiredDocuments.map((requirement) => {
                const relatedDocuments = application.documents.filter(
                  (document) => document.type === requirement.type
                );
                const documentTypeLabel =
                  DOCUMENT_TYPE_LABELS[requirement.type];

                return (
                  <li
                    key={requirement.type}
                    className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-normal">
                        {documentTypeLabel}
                      </h3>
                      <Badge variant="secondary">
                        {requirement.satisfied
                          ? "Received"
                          : requirement.required
                            ? "Required"
                            : "Optional"}
                      </Badge>
                    </div>

                    {relatedDocuments.length > 0 && (
                      <ul className="flex flex-col gap-2">
                        {relatedDocuments.map((document) => (
                          <li
                            key={document.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-3"
                          >
                            <div className="flex min-w-0 flex-col gap-1">
                              <p className="break-all text-sm">
                                {document.fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {describeDocumentStatus(document.status)}
                              </p>
                            </div>
                            {application.canEdit && (
                              <ActionButton
                                type="button"
                                size="small"
                                variant="outline"
                                isLoading={
                                  deleteMutation.isPending &&
                                  deleteMutation.variables === document.id
                                }
                                loadingText="Removing document"
                                disabled={isWorking}
                                onClick={() => void removeDocument(document.id)}
                              >
                                Remove
                              </ActionButton>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {application.canEdit && !requirement.satisfied && (
                      <Field>
                        <FieldLabel htmlFor={`document-${requirement.type}`}>
                          {relatedDocuments.length > 0
                            ? `Replace ${documentTypeLabel.toLowerCase()}`
                            : `Choose ${documentTypeLabel.toLowerCase()}`}
                        </FieldLabel>
                        <Input
                          accept={DOCUMENT_UPLOAD_CONFIGURATION.contentTypes.join(
                            ","
                          )}
                          disabled={isWorking}
                          id={`document-${requirement.type}`}
                          type="file"
                          onChange={(changeEvent) => {
                            const documentFile =
                              changeEvent.currentTarget.files?.[0];
                            changeEvent.currentTarget.value = "";
                            if (documentFile) {
                              void uploadDocument(
                                requirement.type,
                                documentFile
                              );
                            }
                          }}
                        />
                      </Field>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!application.checklist.documentsComplete && application.canEdit && (
            <ActionButton
              type="button"
              variant="outline"
              isLoading={isWorking}
              onClick={async () => {
                setActionError("");
                try {
                  await reloadApplication();
                } catch (error) {
                  setActionError(
                    error instanceof Error
                      ? error.message
                      : "We could not refresh your document status. Try again."
                  );
                }
              }}
            >
              Refresh document status
            </ActionButton>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
            <a
              href="#onboarding-content"
              className="inline-flex min-h-11 items-center text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={onBack}
            >
              Back to account verification
            </a>
            <ActionButton
              type="button"
              disabled={!application.checklist.documentsComplete || isWorking}
              onClick={onContinue}
            >
              Continue to review
            </ActionButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function describeDocumentStatus(status: string): string {
  if (status === "UPLOADING") return "Upload is in progress";
  if (status === "SCANNING") return "Security scan in progress";
  if (status === "INFECTED")
    return "This file could not be accepted. Remove it and upload a new file.";
  if (status === "REJECTED")
    return "This document was rejected. Remove it and upload a corrected file.";
  if (status === "ACCEPTED") return "Accepted for this application";
  return "Uploaded and ready for review";
}
