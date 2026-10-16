"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import type { ActiveSession } from "~/features/organization-onboarding/hooks/use-application-status";
import {
  useMyEvidenceRequestsQuery,
  useSubmitEvidenceDocumentMutation,
} from "~/features/organization-onboarding/hooks/use-evidence-requests";
import { evidenceDocumentUploadSchema } from "~/features/organization-onboarding/model/evidence-request-schema";
import { parseFormData } from "~/shared/forms/form-validation";

type OrganizationEvidenceRequestsProperties = {
  session: ActiveSession;
};

const evidenceStatusLabels = {
  REQUESTED: "Document requested",
  SUBMITTED: "Waiting for HealthAlyst review",
  ACCEPTED: "Accepted",
} as const;

export default function OrganizationEvidenceRequests({
  session,
}: OrganizationEvidenceRequestsProperties) {
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const evidenceRequestsQuery = useMyEvidenceRequestsQuery(
    session.identifier,
    session.response
  );
  const uploadMutation = useSubmitEvidenceDocumentMutation(
    session.response,
    session.identifier
  );

  function handleUpload(
    formEvent: FormEvent<HTMLFormElement>,
    requestId: string
  ) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const validationResult = parseFormData(
      evidenceDocumentUploadSchema,
      new FormData(formElement)
    );
    if (!validationResult.success) {
      setFileErrors((currentErrors) => ({
        ...currentErrors,
        [requestId]: validationResult.errors.file ?? "Choose a file to upload.",
      }));
      formElement
        .querySelector<HTMLInputElement>('input[type="file"]')
        ?.focus();
      return;
    }

    setFileErrors((currentErrors) => {
      const updatedErrors = { ...currentErrors };
      delete updatedErrors[requestId];
      return updatedErrors;
    });
    uploadMutation.mutate({ requestId, file: validationResult.data.file });
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Requested evidence</CardTitle>
        <CardDescription>
          Upload only the documents HealthAlyst requested. Do not upload patient
          or clinical records.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {evidenceRequestsQuery.isPending && (
          <p className="text-sm text-muted-foreground" role="status">
            Loading evidence requests…
          </p>
        )}
        {evidenceRequestsQuery.isError && (
          <div className="flex flex-col items-start gap-3">
            <FieldError>{evidenceRequestsQuery.error.message}</FieldError>
            <ActionButton
              type="button"
              variant="outline"
              disabled={evidenceRequestsQuery.isFetching}
              onClick={() => void evidenceRequestsQuery.refetch()}
            >
              Retry loading evidence requests
            </ActionButton>
          </div>
        )}
        {evidenceRequestsQuery.isSuccess &&
          evidenceRequestsQuery.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              HealthAlyst has not requested additional evidence.
            </p>
          )}
        {evidenceRequestsQuery.data?.map((evidenceRequest) => {
          const latestDocument = evidenceRequest.documents[0];
          const isUploading =
            uploadMutation.isPending &&
            uploadMutation.variables?.requestId === evidenceRequest.requestId;
          const uploadError =
            uploadMutation.error &&
            uploadMutation.variables?.requestId === evidenceRequest.requestId
              ? uploadMutation.error.message
              : null;

          return (
            <section
              key={evidenceRequest.requestId}
              className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4"
              aria-labelledby={`evidence-title-${evidenceRequest.requestId}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3
                  id={`evidence-title-${evidenceRequest.requestId}`}
                  className="font-semibold"
                >
                  {evidenceRequest.title}
                </h3>
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold">
                  {evidenceStatusLabels[evidenceRequest.status]}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {evidenceRequest.instructions}
              </p>
              {evidenceRequest.reviewerNote && (
                <p className="rounded-md border border-border bg-background p-3 text-sm leading-6">
                  Reviewer note: {evidenceRequest.reviewerNote}
                </p>
              )}
              {latestDocument && (
                <p className="text-xs text-muted-foreground">
                  Previous upload: {latestDocument.originalFilename} ·{" "}
                  {Math.ceil(latestDocument.sizeBytes / 1024)} KB
                </p>
              )}
              {evidenceRequest.status === "REQUESTED" && (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(formEvent) =>
                    handleUpload(formEvent, evidenceRequest.requestId)
                  }
                  noValidate
                >
                  <Field
                    data-invalid={Boolean(
                      fileErrors[evidenceRequest.requestId]
                    )}
                  >
                    <FieldLabel
                      htmlFor={`evidence-file-${evidenceRequest.requestId}`}
                    >
                      Evidence document
                    </FieldLabel>
                    <Input
                      id={`evidence-file-${evidenceRequest.requestId}`}
                      name="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      aria-invalid={
                        Boolean(fileErrors[evidenceRequest.requestId]) ||
                        undefined
                      }
                      aria-describedby={
                        fileErrors[evidenceRequest.requestId]
                          ? `evidence-file-error-${evidenceRequest.requestId}`
                          : undefined
                      }
                      onChange={() =>
                        setFileErrors((currentErrors) => {
                          const updatedErrors = { ...currentErrors };
                          delete updatedErrors[evidenceRequest.requestId];
                          return updatedErrors;
                        })
                      }
                    />
                    {fileErrors[evidenceRequest.requestId] && (
                      <FieldError
                        id={`evidence-file-error-${evidenceRequest.requestId}`}
                      >
                        {fileErrors[evidenceRequest.requestId]}
                      </FieldError>
                    )}
                  </Field>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPEG, or PNG. Maximum size: 10 MB. Each upload is
                    scanned before review.
                  </p>
                  {uploadError && <FieldError>{uploadError}</FieldError>}
                  {uploadMutation.isSuccess &&
                    uploadMutation.variables?.requestId ===
                      evidenceRequest.requestId && (
                      <p className="text-sm text-primary" role="status">
                        Your document was received for review.
                      </p>
                    )}
                  <ActionButton
                    type="submit"
                    isLoading={isUploading}
                    loadingText="Scanning and uploading"
                  >
                    Upload evidence
                  </ActionButton>
                </form>
              )}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
