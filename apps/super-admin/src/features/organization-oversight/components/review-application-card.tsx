"use client";

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
import { OrganizationApplicationDetails } from "~/features/organization-oversight/components/organization-application-details";
import { useReviewApplication } from "~/features/organization-oversight/hooks/use-review-application";
import type { ReviewApplicationProperties } from "~/features/organization-oversight/types/review-controller";
import {
  REVIEW_CHECKLIST_ITEMS,
  REVIEW_PRODUCTS,
  REVIEW_REJECTION_REASONS,
  REVIEW_VALIDATION_LIMITS,
} from "~/features/organization-oversight/config/review-configuration";

export function ReviewApplicationCard({
  application,
  staffIdentity,
}: ReviewApplicationProperties) {
  const {
    detailQuery,
    claimMutation,
    releaseMutation,
    decisionMutation,
    checklist,
    selectedProducts,
    decisionError,
    canReview,
    isClaimedByAnotherReviewer,
    handleApprove,
    handleReject,
    updateChecklistItem,
    updateSelectedProduct,
    clearDecisionError,
  } = useReviewApplication({ application, staffIdentity });

  const submittedAtLabel = application.submittedAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(application.submittedAt))
    : "Not submitted";

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-lg">
            {application.displayName || application.legalName}
          </CardTitle>
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold">
            {application.status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Submitted {submittedAtLabel}
          {application.type
            ? ` · ${application.type.replaceAll("_", " ")}`
            : ""}
          {application.stateCode ? ` · ${application.stateCode}` : ""}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {application.status === "PENDING_VERIFICATION" && (
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton
              type="button"
              isLoading={claimMutation.isPending}
              loadingText="Claiming application"
              onClick={() => claimMutation.mutate(application.id)}
            >
              Claim for review
            </ActionButton>
            {claimMutation.error && (
              <FieldError role="alert">
                {claimMutation.error.message}
              </FieldError>
            )}
          </div>
        )}
        {isClaimedByAnotherReviewer && (
          <p className="text-sm text-muted-foreground">
            This application is assigned to another reviewer.
          </p>
        )}
        {canReview && (
          <ActionButton
            type="button"
            variant="outline"
            className="self-start"
            isLoading={releaseMutation.isPending}
            loadingText="Releasing application"
            onClick={() => releaseMutation.mutate(application.id)}
          >
            Return to review queue
          </ActionButton>
        )}
        {releaseMutation.error && (
          <FieldError role="alert">{releaseMutation.error.message}</FieldError>
        )}

        <OrganizationApplicationDetails
          application={application}
          staffIdentity={staffIdentity}
          canReview={canReview}
        />

        {canReview && detailQuery.data && (
          <div className="grid gap-4 border-t border-border pt-5 lg:grid-cols-2">
            <form
              className="flex flex-col gap-4"
              onSubmit={handleApprove}
              noValidate
            >
              <div>
                <h3 className="font-semibold">Approve organisation</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete every verification check and choose the products to
                  enable.
                </p>
              </div>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">
                  Verification checklist
                </legend>
                {REVIEW_CHECKLIST_ITEMS.map((checklistItem) => (
                  <label
                    key={checklistItem.name}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name={checklistItem.name}
                      checked={checklist[checklistItem.name]}
                      onChange={(changeEvent) =>
                        updateChecklistItem(
                          checklistItem.name,
                          changeEvent.target.checked
                        )
                      }
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <span>{checklistItem.label}</span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">
                  Products to enable
                </legend>
                {REVIEW_PRODUCTS.map((product) => (
                  <label
                    key={product.code}
                    className="flex items-start gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="productCode"
                      value={product.code}
                      checked={selectedProducts.includes(product.code)}
                      onChange={(changeEvent) =>
                        updateSelectedProduct(
                          product.code,
                          changeEvent.target.checked
                        )
                      }
                      className="mt-0.5 size-4 accent-primary"
                    />
                    <span>{product.label}</span>
                  </label>
                ))}
              </fieldset>
              <Field className="gap-1.5">
                <FieldLabel htmlFor={`approval-note-${application.id}`}>
                  Internal approval note (optional)
                </FieldLabel>
                <Textarea
                  id={`approval-note-${application.id}`}
                  name="approvalNote"
                  rows={3}
                  maxLength={REVIEW_VALIDATION_LIMITS.noteMaximumLength}
                  onChange={clearDecisionError}
                />
              </Field>
              <ActionButton
                type="submit"
                isLoading={decisionMutation.isPending}
                loadingText="Approving organisation"
              >
                Approve organisation
              </ActionButton>
            </form>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleReject}
              noValidate
            >
              <div>
                <h3 className="font-semibold">Reject application</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rejection is terminal. Give the applicant a clear reason.
                </p>
              </div>
              <Field className="gap-1.5">
                <FieldLabel htmlFor={`rejection-reason-${application.id}`}>
                  Reason
                </FieldLabel>
                <select
                  id={`rejection-reason-${application.id}`}
                  name="reasonCode"
                  defaultValue=""
                  className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Choose a reason
                  </option>
                  {REVIEW_REJECTION_REASONS.map((rejectionReason) => (
                    <option
                      key={rejectionReason.code}
                      value={rejectionReason.code}
                    >
                      {rejectionReason.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor={`rejection-message-${application.id}`}>
                  Explanation for applicant
                </FieldLabel>
                <Textarea
                  id={`rejection-message-${application.id}`}
                  name="rejectionMessage"
                  rows={5}
                  minLength={
                    REVIEW_VALIDATION_LIMITS.rejectionMessageMinimumLength
                  }
                  maxLength={REVIEW_VALIDATION_LIMITS.noteMaximumLength}
                  onChange={clearDecisionError}
                />
              </Field>
              <ActionButton
                type="submit"
                variant="outline"
                disabled={decisionMutation.isPending}
              >
                Reject application
              </ActionButton>
            </form>
          </div>
        )}
        {decisionError && <FieldError role="alert">{decisionError}</FieldError>}
        {decisionMutation.error && (
          <FieldError role="alert">{decisionMutation.error.message}</FieldError>
        )}
        {decisionMutation.isSuccess && (
          <p role="status" className="text-sm text-primary">
            Review decision saved.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
