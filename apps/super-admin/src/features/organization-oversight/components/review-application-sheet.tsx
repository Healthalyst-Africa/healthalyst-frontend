"use client";

import type { ReactNode } from "react";
import { OpenDocumentIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import { FileActionList } from "@healthalyst/ui/components/file-action-list";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { HintText } from "@healthalyst/ui/components/hint-text";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import {
  SummaryDetailList,
  SummaryTiles,
} from "@healthalyst/ui/components/review-summary";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { formatFileSize } from "@healthalyst/ui/lib/file-size";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import {
  APPLICATION_DATE_FORMATTER,
  APPLICATION_STATUS_PRESENTATION,
  ORGANIZATION_TYPE_LABELS,
} from "~/features/organization-oversight/config/organization-application-table";
import {
  REVIEW_CONTENT_TYPE_LABELS,
  REVIEW_DOCUMENT_STATUS_PRESENTATION,
  REVIEW_DOCUMENT_TYPE_LABELS,
  REVIEW_PRODUCT_STATUS_PRESENTATION,
} from "~/features/organization-oversight/config/review-queue";
import {
  REVIEW_CHECKLIST_ITEMS,
  REVIEW_PRODUCTS,
  REVIEW_REJECTION_REASONS,
  REVIEW_VALIDATION_LIMITS,
} from "~/features/organization-oversight/config/review-configuration";
import { useReviewApplication } from "~/features/organization-oversight/hooks/use-review-application";
import { StepUpDialog } from "~/features/staff-auth/components/step-up-dialog";
import type { OrganizationDetail } from "~/features/organization-oversight/types/organization-types";
import type { ReviewApplicationProperties } from "~/features/organization-oversight/types/review-controller";

function readProfileText(
  profile: OrganizationDetail["profile"],
  fieldName: string
): string | null {
  const value = profile[fieldName];
  return typeof value === "string" && value.trim() ? value : null;
}

function ReviewSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-medium">{heading}</h3>
      {children}
    </section>
  );
}

export function ReviewApplicationSheet({
  application,
  staffIdentity,
  open,
  onOpenChange,
}: ReviewApplicationProperties & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const review = useReviewApplication({ application, staffIdentity });
  const detail = review.detailQuery.data;
  const organizationName = application.displayName || application.legalName;
  const statusPresentation =
    APPLICATION_STATUS_PRESENTATION[application.status];

  const assignmentNotice = review.canClaim ? (
    <StateNotice tone="information" title="Waiting for a reviewer">
      Claim this application to record a decision. Other reviewers will see it
      is assigned to you.
    </StateNotice>
  ) : review.canReview ? (
    <StateNotice
      illustration={<EmptySearchIllustration />}
      tone="success"
      title="You are reviewing this application"
      action={
        <ActionButton
          type="button"
          variant="outline"
          isLoading={review.releaseMutation.isPending}
          loadingText="Returning application"
          onClick={() => review.releaseMutation.mutate(application.id)}
        >
          Return to queue
        </ActionButton>
      }
    >
      Check the details and documents, then approve, request changes or reject
      it.
    </StateNotice>
  ) : review.isClaimedByAnotherReviewer ? (
    <StateNotice
      illustration={<EmptyOrganizationsIllustration />}
      tone="information"
      title="Another reviewer is handling this application"
    >
      You can read the details. Only the assigned reviewer can record a
      decision.
    </StateNotice>
  ) : null;

  const footer = review.canClaim ? (
    <ActionButton
      type="button"
      isLoading={review.claimMutation.isPending}
      loadingText="Claiming application"
      onClick={() => review.claimMutation.mutate(application.id)}
    >
      Claim for review
    </ActionButton>
  ) : review.canReview ? (
    <>
      <ActionButton
        type="button"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
        disabled={!detail}
        onClick={() => review.openDecisionDialog("reject")}
      >
        Reject application
      </ActionButton>
      <ActionButton
        type="button"
        variant="link"
        className="px-2"
        disabled={!detail}
        onClick={() => review.openDecisionDialog("changes")}
      >
        Request changes
      </ActionButton>
      <ActionButton
        type="button"
        disabled={!detail}
        onClick={() => review.openDecisionDialog("approve")}
      >
        Approve organisation
      </ActionButton>
    </>
  ) : undefined;

  return (
    <>
      <DetailSheet
        open={open}
        onOpenChange={onOpenChange}
        title={organizationName}
        titleAccessory={
          <StatusLabel tone={statusPresentation.tone}>
            {statusPresentation.label}
          </StatusLabel>
        }
        description={
          application.submittedAt
            ? `Submitted on ${APPLICATION_DATE_FORMATTER.format(new Date(application.submittedAt))}`
            : "Not submitted yet"
        }
        footer={footer}
      >
        <div className="flex flex-col gap-8">
          {assignmentNotice}
          {(review.claimMutation.error || review.releaseMutation.error) && (
            <NoticeBanner tone="error" title="The assignment did not change">
              {(review.claimMutation.error ?? review.releaseMutation.error)
                ?.message ?? "Try again."}
            </NoticeBanner>
          )}

          {review.detailQuery.isPending ? (
            <BrandLoader
              markSource={BRAND_MARK_SOURCE}
              label="Loading application details"
              presentation="inline"
            />
          ) : review.detailQuery.isError ? (
            <StateNotice
              tone="error"
              title="We could not load this application"
              action={
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={() => void review.detailQuery.refetch()}
                >
                  Try again
                </ActionButton>
              }
            >
              {review.detailQuery.error.message}
            </StateNotice>
          ) : detail ? (
            <>
              {detail.possibleDuplicates.length > 0 && (
                <StateNotice
                  tone="warning"
                  title="Possible duplicate organisations"
                >
                  <ul className="flex flex-col gap-1">
                    {detail.possibleDuplicates.map((possibleDuplicate) => (
                      <li key={possibleDuplicate.id}>
                        {possibleDuplicate.legalName},{" "}
                        {APPLICATION_STATUS_PRESENTATION[
                          possibleDuplicate.status
                        ].label.toLowerCase()}
                        {possibleDuplicate.matchedOn.length > 0 &&
                          ` (matched on ${possibleDuplicate.matchedOn.join(", ")})`}
                      </li>
                    ))}
                  </ul>
                </StateNotice>
              )}

              <ReviewSection heading="Organisation">
                <SummaryDetailList
                  details={[
                    {
                      label: "Registered name",
                      value: readProfileText(detail.profile, "legalName"),
                    },
                    {
                      label: "Trading name",
                      value: readProfileText(detail.profile, "displayName"),
                    },
                    {
                      label: "Facility type",
                      value: detail.type
                        ? ORGANIZATION_TYPE_LABELS[detail.type]
                        : null,
                    },
                    {
                      label: "CAC number",
                      value: readProfileText(detail.profile, "cacNumber"),
                    },
                    {
                      label: "Email address",
                      value: readProfileText(detail.profile, "email"),
                    },
                    {
                      label: "Phone number",
                      value: readProfileText(detail.profile, "phone"),
                    },
                    {
                      label: "Address",
                      value:
                        [
                          readProfileText(detail.profile, "addressLine"),
                          readProfileText(detail.profile, "city"),
                          readProfileText(detail.profile, "lga"),
                          readProfileText(detail.profile, "stateCode"),
                        ]
                          .filter(Boolean)
                          .join(", ") || null,
                    },
                    {
                      label: "Facility licence number",
                      value: readProfileText(
                        detail.profile,
                        "facilityLicenceNo"
                      ),
                    },
                  ]}
                />
              </ReviewSection>

              <ReviewSection heading="Products requested">
                {detail.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No products were requested.
                  </p>
                ) : (
                  <SummaryTiles
                    tiles={detail.products.map((product) => {
                      const reviewProduct = REVIEW_PRODUCTS.find(
                        (candidate) => candidate.code === product.code
                      );
                      return {
                        key: product.code,
                        title: reviewProduct?.label ?? product.code,
                        description: reviewProduct?.description,
                        // Every listed product was requested; show other states only.
                        status:
                          product.status === "PENDING"
                            ? undefined
                            : (REVIEW_PRODUCT_STATUS_PRESENTATION[
                                product.status
                              ] ?? {
                                label: product.status,
                                tone: "neutral" as const,
                              }),
                      };
                    })}
                  />
                )}
              </ReviewSection>

              <ReviewSection heading="Documents">
                {detail.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents have been uploaded.
                  </p>
                ) : (
                  <FileActionList
                    items={detail.documents.map((documentRecord) => ({
                      key: documentRecord.id,
                      title: REVIEW_DOCUMENT_TYPE_LABELS[documentRecord.type],
                      details: formatFileSize(documentRecord.sizeBytes),
                      fileTypeLabel:
                        REVIEW_CONTENT_TYPE_LABELS[documentRecord.contentType],
                      status:
                        REVIEW_DOCUMENT_STATUS_PRESENTATION[
                          documentRecord.status
                        ],
                      action: (
                        <ActionButton
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-9 text-primary"
                          aria-label={`View ${REVIEW_DOCUMENT_TYPE_LABELS[documentRecord.type]}`}
                          title="View document"
                          isLoading={
                            review.openingDocumentIdentifier ===
                            documentRecord.id
                          }
                          onClick={() =>
                            void review.openDocument(documentRecord.id)
                          }
                        >
                          {review.openingDocumentIdentifier !==
                            documentRecord.id && (
                            <OpenDocumentIcon
                              aria-hidden="true"
                              className="size-4"
                            />
                          )}
                        </ActionButton>
                      ),
                    }))}
                  />
                )}
                {review.documentViewMutation.error && (
                  <NoticeBanner tone="error" title="The document did not open">
                    {review.documentViewMutation.error.message}
                  </NoticeBanner>
                )}
                <HintText>
                  Documents open in a new tab through a secure link that expires
                  after a minute.
                </HintText>
              </ReviewSection>
            </>
          ) : null}
        </div>
      </DetailSheet>

      <FormDialog
        open={review.openDecision === "approve"}
        onOpenChange={(isOpen) => !isOpen && review.closeDecisionDialog()}
        title="Approve organisation"
        description="Confirm each check, then choose the products this organisation can use."
        submitLabel="Approve organisation"
        submittingLabel="Approving organisation"
        isSubmitting={review.decisionMutation.isPending}
        error={review.decisionError}
        onSubmit={review.handleApprove}
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium">
            Verification checks
          </legend>
          {REVIEW_CHECKLIST_ITEMS.map((checklistItem) => (
            <CheckboxField
              key={checklistItem.name}
              id={`approval-${checklistItem.name}`}
              name={checklistItem.name}
              label={checklistItem.label}
              checked={review.checklist[checklistItem.name]}
              onCheckedChange={(isChecked) =>
                review.updateChecklistItem(checklistItem.name, isChecked)
              }
            />
          ))}
        </fieldset>
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-sm font-medium">
            Products to enable
          </legend>
          {REVIEW_PRODUCTS.map((product) => (
            <CheckboxField
              key={product.code}
              id={`approval-product-${product.code}`}
              name="productCode"
              value={product.code}
              label={product.label}
              checked={review.selectedProducts.includes(product.code)}
              onCheckedChange={(isChecked) =>
                review.updateSelectedProduct(product.code, isChecked)
              }
            />
          ))}
        </fieldset>
        <TextAreaField
          id="approval-note"
          label="Internal note"
          description="Optional. Only HealthAlyst staff can see this."
          name="approvalNote"
          rows={3}
          maxLength={REVIEW_VALIDATION_LIMITS.noteMaximumLength}
        />
      </FormDialog>

      <FormDialog
        open={review.openDecision === "changes"}
        onOpenChange={(isOpen) => !isOpen && review.closeDecisionDialog()}
        title="Request changes"
        description="Tell the applicant what to correct. They can update the application and submit it again."
        submitLabel="Send change request"
        submittingLabel="Sending change request"
        isSubmitting={review.decisionMutation.isPending}
        error={review.decisionError}
        onSubmit={review.handleRequestChanges}
      >
        <TextField
          id="change-field"
          label="What needs attention"
          name="field"
          required
          placeholder="For example, facility licence"
          maxLength={REVIEW_VALIDATION_LIMITS.changeFieldMaximumLength}
        />
        <TextAreaField
          id="change-message"
          label="What should the applicant change?"
          name="message"
          required
          rows={4}
          maxLength={REVIEW_VALIDATION_LIMITS.changeMessageMaximumLength}
        />
      </FormDialog>

      <FormDialog
        open={review.openDecision === "reject"}
        onOpenChange={(isOpen) => !isOpen && review.closeDecisionDialog()}
        title="Reject application"
        description="Rejection is final. The application cannot be reopened."
        submitLabel="Reject application"
        submittingLabel="Rejecting application"
        tone="destructive"
        isSubmitting={review.decisionMutation.isPending}
        error={review.decisionError}
        onSubmit={review.handleReject}
      >
        <SelectField
          id="rejection-reason"
          label="Reason"
          name="reasonCode"
          presentation="native"
          required
          placeholder="Choose a reason"
          options={REVIEW_REJECTION_REASONS.map((rejectionReason) => ({
            value: rejectionReason.code,
            label: rejectionReason.label,
          }))}
        />
        <TextAreaField
          id="rejection-message"
          label="Explanation"
          name="rejectionMessage"
          required
          rows={4}
          minLength={REVIEW_VALIDATION_LIMITS.rejectionMessageMinimumLength}
          maxLength={REVIEW_VALIDATION_LIMITS.noteMaximumLength}
        />
      </FormDialog>

      <StepUpDialog
        open={review.isAwaitingStepUp}
        actionDescription={review.stepUpActionDescription}
        verification={review.stepUpVerification}
        isCompletingAction={review.decisionMutation.isPending}
        onCancel={review.cancelStepUp}
        onSubmit={() => void review.confirmStepUp()}
      />

      {review.completedConfirmation && (
        <FeedbackDialog
          open
          onOpenChange={(isOpen) => {
            if (isOpen) return;
            review.clearCompletedDecision();
            onOpenChange(false);
          }}
          tone="success"
          title={review.completedConfirmation.title}
          description={review.completedConfirmation.description}
          primaryAction={{
            label: "Back to the queue",
            onSelect: () => {
              review.clearCompletedDecision();
              onOpenChange(false);
            },
          }}
        />
      )}
    </>
  );
}
