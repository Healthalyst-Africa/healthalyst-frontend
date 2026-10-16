"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Textarea } from "@healthalyst/ui/components/textarea";
import type { StaffIdentity } from "~/features/staff-auth/api/staff-service";
import type {
  OrganizationApplication,
  RegistrationStatus,
} from "~/features/organization-oversight/api/organization-service";
import { ReviewEvidencePanel } from "~/features/organization-oversight/components/review-evidence-panel";
import { useReviewDecisionMutation } from "~/features/organization-oversight/hooks/use-organization-oversight";
import { reviewDecisionSchema } from "~/features/organization-oversight/model/review-schemas";

export function ReviewApplicationCard({
  application,
  staffIdentity,
}: {
  application: OrganizationApplication;
  staffIdentity: StaffIdentity;
}) {
  const decisionMutation = useReviewDecisionMutation(staffIdentity);
  const [noteError, setNoteError] = useState("");

  function handleDecision(
    formElement: HTMLFormElement,
    status: Exclude<RegistrationStatus, "PENDING_REVIEW">
  ) {
    const result = reviewDecisionSchema.safeParse({
      status,
      note: new FormData(formElement).get("note"),
    });
    if (!result.success) {
      setNoteError(result.error.issues[0]?.message ?? "Check the review note.");
      formElement.querySelector<HTMLTextAreaElement>("[name=note]")?.focus();
      return;
    }
    setNoteError("");
    decisionMutation.mutate({
      applicationId: application.applicationId,
      ...result.data,
    });
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    handleDecision(formEvent.currentTarget, "CHANGES_REQUESTED");
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg">
            {application.organizationName}
          </CardTitle>
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold">
            {application.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Submitted{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(application.submittedAt))}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {[
            [
              "Organisation type",
              application.organizationType.replaceAll("_", " "),
            ],
            ["Registration number", application.registrationNumber],
            ["Organisation email", application.organizationEmailAddress],
            [
              "Organisation phone",
              application.organizationPhoneNumber ?? "Not provided",
            ],
            ["Website", application.websiteUrl ?? "Not provided"],
            ["Product requested", application.productInterest],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 break-all text-sm">{value}</dd>
            </div>
          ))}
        </dl>
        <ReviewEvidencePanel
          applicationId={application.applicationId}
          staffIdentity={staffIdentity}
        />
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <Field data-invalid={Boolean(noteError)}>
            <FieldLabel htmlFor={`review-note-${application.applicationId}`}>
              Review note
            </FieldLabel>
            <Textarea
              id={`review-note-${application.applicationId}`}
              name="note"
              rows={3}
              maxLength={1000}
              placeholder="Explain any changes requested or the reason for rejection."
              aria-invalid={Boolean(noteError) || undefined}
              aria-describedby={
                noteError
                  ? `review-note-error-${application.applicationId}`
                  : undefined
              }
              onChange={() => setNoteError("")}
            />
            {noteError && (
              <FieldError id={`review-note-error-${application.applicationId}`}>
                {noteError}
              </FieldError>
            )}
          </Field>
          {decisionMutation.error && (
            <FieldError role="alert">
              {decisionMutation.error.message}
            </FieldError>
          )}
          {decisionMutation.isSuccess && (
            <p role="status" className="text-sm text-primary">
              Decision saved.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <ActionButton
              type="submit"
              variant="outline"
              disabled={decisionMutation.isPending}
            >
              Request changes
            </ActionButton>
            <ActionButton
              type="button"
              variant="outline"
              disabled={decisionMutation.isPending}
              onClick={(buttonEvent) => {
                const formElement = buttonEvent.currentTarget.form;
                if (formElement) handleDecision(formElement, "REJECTED");
              }}
            >
              Reject
            </ActionButton>
            <ActionButton
              type="button"
              disabled={decisionMutation.isPending}
              isLoading={decisionMutation.isPending}
              loadingText="Saving decision"
              onClick={(buttonEvent) => {
                const formElement = buttonEvent.currentTarget.form;
                if (formElement) handleDecision(formElement, "APPROVED");
              }}
            >
              Approve
            </ActionButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
