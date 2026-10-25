"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { StatusBadge } from "@healthalyst/ui/components/status-badge";
import { useOrganizationApplicationSubmitMutation } from "~/features/organization-application/hooks/use-organization-application";
import {
  ORGANIZATION_STATUS_DESCRIPTIONS,
  ORGANIZATION_STATUS_LABELS,
} from "~/features/organization-application/config/application-presentation";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";

export function OrganizationReviewSubmissionStep({
  application,
  organizationId,
  userId,
  onBack,
}: {
  application: OrganizationApplication;
  organizationId: string;
  userId: string;
  onBack: () => void;
}) {
  const submitMutation = useOrganizationApplicationSubmitMutation({
    organizationId,
    userId,
  });
  const statusLabel =
    ORGANIZATION_STATUS_LABELS[application.status] ?? application.status;
  const statusDescription =
    ORGANIZATION_STATUS_DESCRIPTIONS[application.status] ??
    "Check your application status for the latest information.";
  const isAlreadySubmitted = !application.canEdit;
  const canSubmit = application.canSubmit && Boolean(application.entityTag);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-normal">
          {isAlreadySubmitted ? "Application status" : "Review and submit"}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {isAlreadySubmitted
            ? statusDescription
            : "Check that your organisation details and supporting documents are ready. Submitting sends the application to HealthAlyst for review."}
        </p>
      </div>

      <ContentPanel elevation="flat" spacing="compact">
        {isAlreadySubmitted ? (
          <NoticeBanner title={statusLabel}>
            {application.submittedAt
              ? `Submitted on ${new Date(application.submittedAt).toLocaleDateString()}.`
              : "Your application is no longer accepting submissions."}
          </NoticeBanner>
        ) : (
          <>
            <ChecklistRow
              label="Organisation details"
              complete={application.checklist.profileComplete}
            />
            <ChecklistRow
              label="Account verification"
              complete={
                application.checklist.emailVerified &&
                application.checklist.phoneVerified &&
                application.checklist.mfaEnrolled
              }
            />
            <ChecklistRow
              label="Supporting documents"
              complete={application.checklist.documentsComplete}
            />

            {!canSubmit && (
              <NoticeBanner title="Complete the remaining steps first">
                Your application can be submitted after all three checklist
                items are complete. Return to the incomplete step to finish it.
              </NoticeBanner>
            )}

            {submitMutation.error && (
              <NoticeBanner
                tone="error"
                title="We could not submit your application"
              >
                {submitMutation.error.message}
              </NoticeBanner>
            )}

            {submitMutation.isSuccess && (
              <NoticeBanner title="Application submitted">
                HealthAlyst has received your organisation application for
                review.
              </NoticeBanner>
            )}
          </>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
          {!isAlreadySubmitted && (
            <a
              href="#onboarding-content"
              className="inline-flex min-h-11 items-center text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={onBack}
            >
              Back to supporting documents
            </a>
          )}
          {!isAlreadySubmitted && (
            <ActionButton
              type="button"
              isLoading={submitMutation.isPending}
              loadingText="Submitting application"
              disabled={!canSubmit || submitMutation.isSuccess}
              onClick={() => {
                if (application.entityTag) {
                  submitMutation.mutate(application.entityTag);
                }
              }}
            >
              Submit application for review
            </ActionButton>
          )}
        </div>
      </ContentPanel>
    </div>
  );
}

function ChecklistRow({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm">{label}</p>
      <StatusBadge emphasis={complete ? "filled" : "outlined"}>
        {complete ? "Complete" : "Incomplete"}
      </StatusBadge>
    </div>
  );
}
