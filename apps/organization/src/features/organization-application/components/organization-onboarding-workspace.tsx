"use client";

import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@healthalyst/ui/components/alert";
import { Skeleton } from "@healthalyst/ui/components/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@healthalyst/ui/components/select";
import OrganizationOnboardingLayout from "~/components/ui/organization-onboarding-layout";
import { useOrganizationOnboardingWorkspace } from "~/features/organization-application/hooks/use-organization-onboarding-workspace";
import { OrganizationOnboardingProgress } from "~/features/organization-application/components/organization-onboarding-progress";
import { OrganizationAccountVerificationStep } from "~/features/organization-application/components/organization-account-verification-step";
import { OrganizationSupportingDocumentsStep } from "~/features/organization-application/components/organization-supporting-documents-step";
import { OrganizationReviewSubmissionStep } from "~/features/organization-application/components/organization-review-submission-step";
import {
  ORGANIZATION_STATUS_DESCRIPTIONS,
  ORGANIZATION_STATUS_LABELS,
} from "~/features/organization-application/config/application-presentation";
import { OrganizationOnboardingForm } from "~/features/organization-application/components/organization-onboarding-form";
import { type OrganizationOnboardingStepIdentifier } from "~/features/organization-application/config/organization-onboarding-steps";
import { useState } from "react";

export function OrganizationOnboardingWorkspace({
  session,
  onSignedOut,
}: {
  session: PlatformSession;
  onSignedOut: () => void;
}) {
  const [currentStep, setCurrentStep] =
    useState<OrganizationOnboardingStepIdentifier>("details");
  const {
    organizationId,
    applicationQuery,
    signOutMutation,
    contextMutation,
    selectOrganization,
  } = useOrganizationOnboardingWorkspace(session);
  const application = applicationQuery.data;
  const queryError = applicationQuery.error;
  const statusLabel = application
    ? (ORGANIZATION_STATUS_LABELS[application.status] ?? application.status)
    : "Onboarding";
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
          />
        ) : undefined
      }
      actions={
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">
              {session.user.firstName} {session.user.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {session.user.email}
            </p>
          </div>
          <ActionButton
            type="button"
            variant="ghost"
            isLoading={signOutMutation.isPending}
            loadingText="Signing out"
            onClick={() =>
              signOutMutation.mutate(undefined, { onSuccess: onSignedOut })
            }
          >
            Sign out
          </ActionButton>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-normal leading-tight sm:text-4xl">
            {application && !application.canEdit
              ? "Your organisation"
              : "Set up your organisation"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {application && !application.canEdit
              ? "Your organisation setup is read-only at this stage. Check the status details below."
              : visibleStep === "details"
                ? "Review your organisation details and complete anything that is missing. The information you gave during registration is already filled in."
                : visibleStep === "verification"
                  ? "Verify your phone number to continue."
                  : visibleStep === "documents"
                    ? "Upload the registration and facility documents requested for your organisation."
                    : "Check that each step is complete, then submit your application for review."}
          </p>
        </div>
        {signOutMutation.error && (
          <Alert variant="destructive">
            <AlertTitle>We could not sign you out</AlertTitle>
            <AlertDescription>{signOutMutation.error.message}</AlertDescription>
          </Alert>
        )}
        {!organizationId ? (
          <Alert>
            <AlertTitle>
              {session.memberships.length
                ? "Choose your organisation"
                : "No organisation is linked to this account"}
            </AlertTitle>
            <AlertDescription>
              {session.memberships.length ? (
                <Select
                  disabled={contextMutation.isPending}
                  onValueChange={selectOrganization}
                >
                  <SelectTrigger aria-label="Organisation to onboard">
                    <SelectValue placeholder="Select your organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {session.memberships.map((membership) => (
                        <SelectItem
                          key={membership.membershipId}
                          value={membership.organization.id}
                        >
                          {membership.organization.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <p>Contact HealthAlyst for help finding your organisation.</p>
              )}
              {contextMutation.error && (
                <p role="alert">{contextMutation.error.message}</p>
              )}
            </AlertDescription>
          </Alert>
        ) : applicationQuery.isPending ? (
          <div
            className="flex flex-col gap-6 rounded-2xl border border-border p-8"
            role="status"
          >
            <span className="sr-only">Loading your organisation details</span>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-5 sm:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        ) : queryError ? (
          <Alert variant="destructive">
            <AlertTitle>We could not load your organisation</AlertTitle>
            <AlertDescription>
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
            </AlertDescription>
          </Alert>
        ) : application ? (
          <>
            {(!application.canEdit ||
              application.status === "CHANGES_REQUESTED") && (
              <Alert>
                <AlertTitle>{statusLabel}</AlertTitle>
                <AlertDescription>
                  <p>
                    {ORGANIZATION_STATUS_DESCRIPTIONS[application.status]}
                    {!application.canEdit &&
                      " Your onboarding details are read-only at this stage."}
                  </p>
                  {application.messages.length > 0 && (
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
                  )}
                </AlertDescription>
              </Alert>
            )}
            {visibleStep === "details" ? (
              <OrganizationOnboardingForm
                key={application.id}
                application={application}
                organizationId={organizationId}
                userId={session.user.id}
                reloadApplication={reloadApplication}
                onContinue={() => setCurrentStep("verification")}
              />
            ) : visibleStep === "verification" ? (
              <OrganizationAccountVerificationStep
                application={application}
                session={session}
                onBack={() => setCurrentStep("details")}
                onContinue={() => setCurrentStep("documents")}
                onPhoneVerified={() => void applicationQuery.refetch()}
              />
            ) : visibleStep === "documents" ? (
              <OrganizationSupportingDocumentsStep
                application={application}
                organizationId={organizationId}
                userId={session.user.id}
                reloadApplication={reloadApplication}
                onBack={() => setCurrentStep("verification")}
                onContinue={() => setCurrentStep("review")}
              />
            ) : (
              <OrganizationReviewSubmissionStep
                application={application}
                organizationId={organizationId}
                userId={session.user.id}
                onBack={() => setCurrentStep("documents")}
              />
            )}
          </>
        ) : null}
      </div>
    </OrganizationOnboardingLayout>
  );
}
