"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
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
    <ContentPanel
      heading={application.displayName || application.legalName}
      headingAccessory={
        <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold">
          {application.status.replaceAll("_", " ")}
        </span>
      }
      description={
        <>
          Submitted {submittedAtLabel}
          {application.type
            ? ` · ${application.type.replaceAll("_", " ")}`
            : ""}
          {application.stateCode ? ` · ${application.stateCode}` : ""}
        </>
      }
    >
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
            <FormMessage tone="error">
              {claimMutation.error.message}
            </FormMessage>
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
        <FormMessage tone="error">{releaseMutation.error.message}</FormMessage>
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
              <h3 className="font-serif font-normal">Approve organisation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete every verification check and choose the products to
                enable.
              </p>
            </div>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-normal">
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
              <legend className="mb-2 text-sm font-normal">
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
            <TextAreaField
              id={`approval-note-${application.id}`}
              label="Internal approval note (optional)"
              name="approvalNote"
              rows={3}
              maxLength={REVIEW_VALIDATION_LIMITS.noteMaximumLength}
              onChange={clearDecisionError}
            />
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
              <h3 className="font-serif font-normal">Reject application</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Rejection is terminal. Give the applicant a clear reason.
              </p>
            </div>
            <SelectField
              id={`rejection-reason-${application.id}`}
              label="Reason"
              name="reasonCode"
              presentation="native"
              placeholder="Choose a reason"
              options={REVIEW_REJECTION_REASONS.map((rejectionReason) => ({
                value: rejectionReason.code,
                label: rejectionReason.label,
              }))}
            />
            <TextAreaField
              id={`rejection-message-${application.id}`}
              label="Explanation for applicant"
              name="rejectionMessage"
              rows={5}
              minLength={REVIEW_VALIDATION_LIMITS.rejectionMessageMinimumLength}
              maxLength={REVIEW_VALIDATION_LIMITS.noteMaximumLength}
              onChange={clearDecisionError}
            />
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
      {decisionError && <FormMessage tone="error">{decisionError}</FormMessage>}
      {decisionMutation.error && (
        <FormMessage tone="error">{decisionMutation.error.message}</FormMessage>
      )}
      {decisionMutation.isSuccess && (
        <FormMessage tone="success">Review decision saved.</FormMessage>
      )}
    </ContentPanel>
  );
}
