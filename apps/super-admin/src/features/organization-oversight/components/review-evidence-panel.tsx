"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import { Textarea } from "@healthalyst/ui/components/textarea";
import type { StaffIdentity } from "~/features/staff-auth/api/staff-service";
import {
  useCreateEvidenceMutation,
  useDownloadEvidenceMutation,
  useEvidenceQuery,
  useReviewEvidenceMutation,
} from "~/features/organization-oversight/hooks/use-organization-oversight";
import {
  evidenceRequestSchema,
  evidenceReviewSchema,
} from "~/features/organization-oversight/model/review-schemas";

export function ReviewEvidencePanel({
  staffIdentity,
  applicationId,
}: {
  staffIdentity: StaffIdentity;
  applicationId: string;
}) {
  const evidenceQuery = useEvidenceQuery(staffIdentity, applicationId);
  const requestMutation = useCreateEvidenceMutation(
    staffIdentity,
    applicationId
  );
  const reviewMutation = useReviewEvidenceMutation(
    staffIdentity,
    applicationId
  );
  const downloadMutation = useDownloadEvidenceMutation();
  const [requestError, setRequestError] = useState("");
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});

  function handleRequest(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = evidenceRequestSchema.safeParse({
      title: formData.get("title"),
      instructions: formData.get("instructions"),
    });
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setRequestError(firstIssue?.message ?? "Check the evidence request.");
      const invalidFieldName =
        firstIssue?.path[0] === "instructions" ? "instructions" : "title";
      formElement
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${invalidFieldName}"]`
        )
        ?.focus();
      return;
    }
    setRequestError("");
    requestMutation.mutate(result.data, {
      onSuccess: () => formElement.reset(),
    });
  }

  function handleReview(
    formElement: HTMLFormElement,
    requestId: string,
    accepted: boolean
  ) {
    const formData = new FormData(formElement);
    const result = evidenceReviewSchema.safeParse({
      accepted,
      note: formData.get("note"),
    });
    if (!result.success) {
      setReviewErrors((errors) => ({
        ...errors,
        [requestId]:
          result.error.issues[0]?.message ?? "Check the review note.",
      }));
      formElement.querySelector<HTMLTextAreaElement>("[name=note]")?.focus();
      return;
    }
    setReviewErrors((errors) => ({ ...errors, [requestId]: "" }));
    reviewMutation.mutate({ requestId, ...result.data });
  }

  async function handleDownload(documentId: string, filename: string) {
    try {
      const content = await downloadMutation.mutateAsync({
        applicationId,
        documentId,
      });
      const objectUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      // The mutation error is shown beside the document list.
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
      <div>
        <h3 className="text-lg font-semibold">KYC evidence</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask for the documents needed to review this application.
        </p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleRequest} noValidate>
        <FieldGroup className="gap-3 sm:grid sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor={`evidence-title-${applicationId}`}>
              Evidence requested
            </FieldLabel>
            <Input
              id={`evidence-title-${applicationId}`}
              name="title"
              maxLength={160}
              placeholder="For example, operating licence"
              aria-invalid={Boolean(requestError) || undefined}
              onChange={() => setRequestError("")}
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor={`evidence-instructions-${applicationId}`}>
              Instructions
            </FieldLabel>
            <Textarea
              id={`evidence-instructions-${applicationId}`}
              name="instructions"
              rows={2}
              maxLength={1000}
              placeholder="Explain what document is acceptable."
              aria-invalid={Boolean(requestError) || undefined}
              onChange={() => setRequestError("")}
            />
          </Field>
        </FieldGroup>
        {requestError && <FieldError role="alert">{requestError}</FieldError>}
        {requestMutation.error && (
          <FieldError role="alert">{requestMutation.error.message}</FieldError>
        )}
        {requestMutation.isSuccess && (
          <p role="status" className="text-sm text-primary">
            Evidence request sent.
          </p>
        )}
        <div>
          <ActionButton
            type="submit"
            variant="outline"
            isLoading={requestMutation.isPending}
            loadingText="Sending request"
          >
            Request evidence
          </ActionButton>
        </div>
      </form>
      {evidenceQuery.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading evidence…
        </p>
      )}
      {evidenceQuery.isError && (
        <div className="flex flex-col items-start gap-2">
          <FieldError role="alert">{evidenceQuery.error.message}</FieldError>
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => void evidenceQuery.refetch()}
          >
            Retry loading evidence
          </ActionButton>
        </div>
      )}
      {evidenceQuery.isSuccess && evidenceQuery.data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No evidence has been requested yet.
        </p>
      )}
      {evidenceQuery.data?.map((request) => (
        <article
          key={request.requestId}
          className="flex flex-col gap-3 rounded-md border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold">{request.title}</h4>
            <span className="text-xs font-semibold text-muted-foreground">
              {request.status.toLowerCase()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {request.instructions}
          </p>
          {request.reviewerNote && (
            <p className="text-sm">
              Latest review note: {request.reviewerNote}
            </p>
          )}
          {request.documents.map((documentRecord) => (
            <div
              key={documentRecord.documentId}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3"
            >
              <span className="break-all text-sm">
                {documentRecord.originalFilename} ·{" "}
                {Math.ceil(documentRecord.sizeBytes / 1024)} KB
              </span>
              <ActionButton
                type="button"
                size="small"
                variant="outline"
                disabled={downloadMutation.isPending}
                onClick={() =>
                  void handleDownload(
                    documentRecord.documentId,
                    documentRecord.originalFilename
                  )
                }
              >
                Download document
              </ActionButton>
            </div>
          ))}
          {downloadMutation.error && (
            <FieldError role="alert">
              {downloadMutation.error.message}
            </FieldError>
          )}
          {request.status === "SUBMITTED" && (
            <form
              className="flex flex-col gap-3"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                handleReview(formEvent.currentTarget, request.requestId, false);
              }}
              noValidate
            >
              <Field data-invalid={Boolean(reviewErrors[request.requestId])}>
                <FieldLabel htmlFor={`evidence-note-${request.requestId}`}>
                  Reviewer note
                </FieldLabel>
                <Textarea
                  id={`evidence-note-${request.requestId}`}
                  name="note"
                  rows={2}
                  maxLength={1000}
                  placeholder="Required when requesting a replacement."
                  aria-invalid={
                    Boolean(reviewErrors[request.requestId]) || undefined
                  }
                  onChange={() =>
                    setReviewErrors((errors) => ({
                      ...errors,
                      [request.requestId]: "",
                    }))
                  }
                />
                {reviewErrors[request.requestId] && (
                  <FieldError role="alert">
                    {reviewErrors[request.requestId]}
                  </FieldError>
                )}
              </Field>
              {reviewMutation.error &&
                reviewMutation.variables?.requestId === request.requestId && (
                  <FieldError role="alert">
                    {reviewMutation.error.message}
                  </FieldError>
                )}
              <div className="flex flex-wrap gap-3">
                <ActionButton
                  type="submit"
                  variant="outline"
                  disabled={reviewMutation.isPending}
                >
                  Request replacement
                </ActionButton>
                <ActionButton
                  type="button"
                  disabled={reviewMutation.isPending}
                  onClick={(buttonEvent) => {
                    const formElement = buttonEvent.currentTarget.form;
                    if (formElement)
                      handleReview(formElement, request.requestId, true);
                  }}
                >
                  Accept evidence
                </ActionButton>
              </div>
            </form>
          )}
        </article>
      ))}
    </section>
  );
}
