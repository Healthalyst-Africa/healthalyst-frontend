"use client";

import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import OrganizationOnboardingLayout from "~/components/ui/organization-onboarding-layout";
import { useOrganizationOnboardingWorkspace } from "~/features/organization-application/hooks/use-organization-onboarding-workspace";
import {
  OrganizationOnboardingProgress,
  OrganizationOnboardingProgressSummary,
} from "~/features/organization-application/components/organization-onboarding-progress";
import { OrganizationAccountVerificationStep } from "~/features/organization-application/components/organization-account-verification-step";
import { OrganizationSupportingDocumentsStep } from "~/features/organization-application/components/organization-supporting-documents-step";
import { OrganizationReviewSubmissionStep } from "~/features/organization-application/components/organization-review-submission-step";
import { OrganizationOnboardingForm } from "~/features/organization-application/components/organization-onboarding-form";
import { useOnboardingStep } from "~/features/organization-application/hooks/use-onboarding-step";

export function OrganizationOnboardingWorkspace({
  session,
  onSignedOut,
}: {
  session: PlatformSession;
  onSignedOut: () => void;
}) {
  const { currentStep, goToStep } = useOnboardingStep();
  const {
    organizationId,
    applicationQuery,
    signOutMutation,
    contextMutation,
    selectOrganization,
  } = useOrganizationOnboardingWorkspace(session);
  const application = applicationQuery.data;
  const queryError = applicationQuery.error;
  const visibleStep =
    application && !application.canEdit ? "review" : currentStep;

  async function reloadApplication() {
    const queryResult = await applicationQuery.refetch();
    if (queryResult.error) throw queryResult.error;
    return queryResult.data;
  }

  return (
    <OrganizationOnboardingLayout
      progress={
        organizationId ? (
          <OrganizationOnboardingProgress
            application={application}
            currentStep={visibleStep}
            onStepSelect={goToStep}
          />
        ) : undefined
      }
      compactProgress={
        organizationId ? (
          <OrganizationOnboardingProgressSummary
            application={application}
            currentStep={visibleStep}
            onStepSelect={goToStep}
          />
        ) : undefined
      }
      actions={
        <AccountMenu
          fullName={`${session.user.firstName} ${session.user.lastName}`}
          emailAddress={session.user.email ?? ""}
          error={signOutMutation.error?.message}
          actions={[
            {
              label: "Sign out",
              pendingLabel: "Signing out…",
              isPending: signOutMutation.isPending,
              icon: <SignOutIcon aria-hidden="true" />,
              tone: "destructive",
              onSelect: () =>
                signOutMutation.mutate(undefined, { onSuccess: onSignedOut }),
            },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-display font-normal">
            {application && !application.canEdit
              ? "Your organisation"
              : "Set up your organisation"}
          </h1>
          <p className="max-w-2xl text-lede text-muted-foreground">
            {application && !application.canEdit
              ? "Your organisation setup is read-only at this stage. Check the status details below."
              : visibleStep === "details"
                ? "Review your organisation details and complete anything that is missing. The information you gave during registration is already filled in."
                : visibleStep === "verification"
                  ? "Verify your phone number if you want HealthAlyst to reach you by text. It is optional."
                  : visibleStep === "documents"
                    ? "Upload the registration and facility documents requested for your organisation."
                    : "Check that each step is complete, then submit your application for review."}
          </p>
        </div>
        {!organizationId ? (
          <NoticeBanner
            title={
              session.memberships.length
                ? "Choose your organisation"
                : "No organisation is linked to this account"
            }
          >
            {session.memberships.length ? (
              <SelectField
                className="w-full"
                id="organization-to-onboard"
                label="Organisation to onboard"
                hideLabel
                placeholder="Select your organisation"
                disabled={contextMutation.isPending}
                options={session.memberships.map((membership) => ({
                  value: membership.organization.id,
                  label: membership.organization.name,
                }))}
                onValueChange={selectOrganization}
              />
            ) : (
              <p>Contact HealthAlyst for help finding your organisation.</p>
            )}
            {contextMutation.error && (
              <FormMessage tone="error">
                {contextMutation.error.message}
              </FormMessage>
            )}
          </NoticeBanner>
        ) : applicationQuery.isPending ? (
          <LoadingPlaceholder
            label="Loading your organisation details"
            framed
            rows={[
              { shape: "heading", width: "medium" },
              { shape: "field" },
              { shape: "field", columns: 2 },
              { shape: "field" },
            ]}
          />
        ) : queryError ? (
          <StateNotice tone="error" title="We could not load your organisation">
            <p>
              {queryError instanceof PlatformApiError &&
              queryError.code === "APPLICATION_NOT_FOUND"
                ? "No onboarding application was found for this organisation. Contact HealthAlyst for help."
                : queryError.message}
            </p>
            <ActionButton
              type="button"
              variant="outline"
              isLoading={applicationQuery.isRefetching}
              onClick={() => void applicationQuery.refetch()}
            >
              Try again
            </ActionButton>
          </StateNotice>
        ) : application ? (
          <>
            {/* Reviewer requests appear only when an application is sent back. */}
            {application.status === "CHANGES_REQUESTED" &&
              application.messages.length > 0 && (
                <StateNotice tone="warning" title="Changes requested">
                  <ul className="flex flex-col gap-3">
                    {application.messages.map((reviewMessage) => (
                      <li
                        key={`${reviewMessage.createdAt}-${reviewMessage.toStatus}`}
                      >
                        {reviewMessage.message && (
                          <p>{reviewMessage.message}</p>
                        )}
                        {reviewMessage.items && (
                          <ul className="flex list-inside list-disc flex-col gap-1">
                            {reviewMessage.items.map((messageItem) => (
                              <li
                                key={`${messageItem.field}-${messageItem.message}`}
                              >
                                {messageItem.message}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </StateNotice>
              )}
            {visibleStep === "details" ? (
              <OrganizationOnboardingForm
                key={application.id}
                application={application}
                organizationId={organizationId}
                userId={session.user.id}
                reloadApplication={reloadApplication}
                onContinue={() => goToStep("verification")}
              />
            ) : visibleStep === "verification" ? (
              <OrganizationAccountVerificationStep
                application={application}
                session={session}
                onBack={() => goToStep("details")}
                onContinue={() => goToStep("documents")}
                onPhoneVerified={() => void applicationQuery.refetch()}
              />
            ) : visibleStep === "documents" ? (
              <OrganizationSupportingDocumentsStep
                application={application}
                organizationId={organizationId}
                userId={session.user.id}
                reloadApplication={reloadApplication}
                onBack={() => goToStep("verification")}
                onContinue={() => goToStep("review")}
              />
            ) : (
              <OrganizationReviewSubmissionStep
                application={application}
                organizationId={organizationId}
                userId={session.user.id}
                enabledProductCodes={
                  session.memberships.find(
                    (membership) =>
                      membership.organization.id === organizationId
                  )?.products ?? []
                }
                onBack={() => goToStep("documents")}
                onEditStep={goToStep}
              />
            )}
          </>
        ) : null}
      </div>
    </OrganizationOnboardingLayout>
  );
}
