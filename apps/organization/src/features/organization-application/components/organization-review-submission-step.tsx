"use client";

import { useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import Image from "next/image";
import { ChevronLeftIcon } from "@healthalyst/icons";
import { ApplicationLauncherDialog } from "@healthalyst/ui/components/application-launcher-dialog";
import { FeedbackDialog } from "@healthalyst/ui/components/feedback-dialog";
import {
  NoticeBanner,
  NoticeBannerLinks,
} from "@healthalyst/ui/components/notice-banner";
import {
  ReviewSections,
  SummaryChecks,
  SummaryDetailList,
  SummaryFiles,
  type ReviewLink,
  type SummaryFile,
} from "@healthalyst/ui/components/review-summary";
import { AttentionNeededIllustration } from "@healthalyst/ui/illustrations/attention-needed-illustration";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { useOrganizationApplicationSubmitMutation } from "~/features/organization-application/hooks/use-organization-application";
import {
  ORGANIZATION_STATUS_DESCRIPTIONS,
  ORGANIZATION_STATUS_LABELS,
} from "~/features/organization-application/config/application-presentation";
import {
  DOCUMENT_CONTENT_TYPE_LABELS,
  DOCUMENT_STATUS_PRESENTATION,
  DOCUMENT_TYPE_LABELS,
} from "~/features/organization-application/config/document-presentation";
import {
  ONBOARDING_STEP_QUERY_PARAMETER,
  type OrganizationOnboardingStepIdentifier,
} from "~/features/organization-application/config/organization-onboarding-steps";
import {
  nigerianStateOptions,
  organizationTypeOptions,
} from "~/shared/organization/config/organization-reference";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";
import { getHealthScheduleAddress } from "~/config/application-addresses";
import {
  ORGANIZATION_PRODUCTS,
  type OrganizationProductCode,
} from "~/shared/organization/config/organization-products";

const PRODUCT_IMAGE_SOURCES: Record<OrganizationProductCode, string> = {
  HEALTHSCHEDULE: "/images/module-hospital.webp",
  LABCONNECT: "/images/module-laboratory.webp",
  PHARMADESK: "/images/module-pharmacy.webp",
};

const SUBMISSION_DATE_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "long",
  timeZone: "Africa/Lagos",
});

/** "Facility licence" reads as "facility licence" mid-sentence; "CAC certificate" is kept. */
function toSentencePhrase(label: string): string {
  const secondCharacter = label.charAt(1);
  return secondCharacter && secondCharacter === secondCharacter.toUpperCase()
    ? label
    : label.charAt(0).toLowerCase() + label.slice(1);
}

export function OrganizationReviewSubmissionStep({
  application,
  organizationId,
  userId,
  onBack,
  onEditStep,
}: {
  application: OrganizationApplication;
  organizationId: string;
  userId: string;
  onBack: () => void;
  onEditStep: (step: OrganizationOnboardingStepIdentifier) => void;
}) {
  const submitMutation = useOrganizationApplicationSubmitMutation({
    organizationId,
    userId,
  });
  const [submissionFeedback, setSubmissionFeedback] = useState<
    "success" | "error" | null
  >(null);
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const isAlreadySubmitted = !application.canEdit;
  const chosenProductCodes = new Set(
    application.products.map((product) => product.code)
  );
  const healthScheduleAddress = getHealthScheduleAddress();
  const launcherApplications = ORGANIZATION_PRODUCTS.map((product) => {
    const isChosen = chosenProductCodes.has(product.code);
    // Only HealthSchedule has an application to open so far.
    const href =
      isChosen && product.code === "HEALTHSCHEDULE"
        ? (healthScheduleAddress ?? undefined)
        : undefined;
    return {
      key: product.code,
      name: product.name,
      description: product.description,
      image: (
        <Image
          src={PRODUCT_IMAGE_SOURCES[product.code]}
          alt=""
          fill
          sizes="(min-width: 640px) 240px, (min-width: 420px) 50vw, 100vw"
        />
      ),
      href,
      available: isChosen,
      unavailableLabel: !isChosen
        ? "Not selected"
        : href
          ? undefined
          : "Coming soon",
    };
  });

  function submitApplication() {
    submitMutation.mutate(application.entityTag, {
      onSuccess: () => setSubmissionFeedback("success"),
      onError: () => setSubmissionFeedback("error"),
    });
  }
  const { profile, checklist } = application;

  function linkToStep(
    step: OrganizationOnboardingStepIdentifier,
    label: string
  ): ReviewLink {
    return {
      label,
      href: `?${ONBOARDING_STEP_QUERY_PARAMETER}=${step}#onboarding-content`,
      onSelect: () => onEditStep(step),
    };
  }

  const facilityTypeLabel = organizationTypeOptions.find(
    (option) => option.value === profile.type
  )?.label;
  const stateLabel = nigerianStateOptions.find(
    (option) => option.value === profile.stateCode
  )?.label;
  const address = [profile.addressLine, profile.city, profile.lga, stateLabel]
    .filter(Boolean)
    .join(", ");

  const verificationChecks = [
    {
      key: "email",
      label: checklist.emailVerified
        ? "Email address verified"
        : "Email address not verified",
      complete: checklist.emailVerified,
      remainingLabel: "Confirm your administrator email address",
    },
    {
      key: "authenticator",
      label: checklist.mfaEnrolled
        ? "Authenticator app set up"
        : "Authenticator app not set up",
      complete: checklist.mfaEnrolled,
      remainingLabel: "Set up your authenticator app",
    },
    {
      key: "phone",
      label: checklist.phoneVerified
        ? "Phone number verified"
        : "Phone number not verified",
      complete: checklist.phoneVerified,
      remainingLabel: "Verify your phone number",
    },
  ];
  const completeCheckCount = verificationChecks.filter(
    (check) => check.complete
  ).length;
  const isVerificationComplete =
    completeCheckCount === verificationChecks.length;

  const requiredDocuments = application.requiredDocuments.filter(
    (requirement) => requirement.required
  );
  const missingRequiredDocuments = requiredDocuments.filter(
    (requirement) => !requirement.satisfied
  );
  const documentFiles: SummaryFile[] = application.requiredDocuments
    .map((requirement) => ({
      requirement,
      latestDocument: application.documents
        .filter((document) => document.type === requirement.type)
        .at(-1),
    }))
    // Optional documents appear only once something has been added.
    .filter(
      ({ requirement, latestDocument }) =>
        requirement.required || latestDocument
    )
    .map(({ requirement, latestDocument }) => {
      const label = DOCUMENT_TYPE_LABELS[requirement.type];
      const statusPresentation = latestDocument
        ? DOCUMENT_STATUS_PRESENTATION[latestDocument.status]
        : undefined;
      return {
        key: requirement.type,
        label,
        file:
          latestDocument && statusPresentation
            ? {
                fileTypeLabel:
                  DOCUMENT_CONTENT_TYPE_LABELS[latestDocument.contentType],
                status: {
                  label: statusPresentation.label,
                  tone: statusPresentation.tone,
                },
              }
            : undefined,
        addLink: isAlreadySubmitted
          ? undefined
          : linkToStep("documents", `Add ${toSentencePhrase(label)}`),
      };
    });

  const remainingItems = [
    ...(checklist.profileComplete
      ? []
      : [
          {
            key: "details",
            ...linkToStep("details", "Complete your organisation details"),
          },
        ]),
    ...verificationChecks
      .filter((check) => !check.complete)
      .map((check) => ({
        key: check.key,
        ...linkToStep("verification", check.remainingLabel),
      })),
    ...missingRequiredDocuments.map((requirement) => ({
      key: requirement.type,
      ...linkToStep(
        "documents",
        `Add ${toSentencePhrase(DOCUMENT_TYPE_LABELS[requirement.type])}`
      ),
    })),
  ];
  const remainingCount = remainingItems.length;

  return (
    <div className="flex flex-col gap-6">
      {isAlreadySubmitted ? (
        <NoticeBanner
          tone="information"
          size="prominent"
          illustration={<EmptyReviewQueueIllustration />}
          action={
            <ActionButton type="button" onClick={() => setIsLauncherOpen(true)}>
              Continue to dashboard
            </ActionButton>
          }
          title={
            ORGANIZATION_STATUS_LABELS[application.status] ?? application.status
          }
        >
          <p>
            {ORGANIZATION_STATUS_DESCRIPTIONS[application.status] ??
              "Check your application status for the latest information."}
            {application.submittedAt &&
              ` Submitted on ${SUBMISSION_DATE_FORMATTER.format(
                new Date(application.submittedAt)
              )}.`}
          </p>
        </NoticeBanner>
      ) : remainingCount === 0 ? (
        <NoticeBanner
          tone="success"
          size="prominent"
          illustration={<DocumentsCompleteIllustration />}
          title="Your application is ready to submit"
        >
          <p>
            HealthAlyst will review your organisation details and documents,
            then let you know the outcome.
          </p>
        </NoticeBanner>
      ) : (
        <NoticeBanner
          tone="warning"
          size="prominent"
          illustration={<AttentionNeededIllustration />}
          title={`${remainingCount} ${remainingCount === 1 ? "thing" : "things"} left before you submit`}
        >
          <p>
            You can submit at any time. HealthAlyst reviews every application
            and may ask you for anything still missing.
          </p>
          <NoticeBannerLinks links={remainingItems} />
        </NoticeBanner>
      )}

      <div className="flex flex-col gap-6">
        <ReviewSections
          sections={[
            {
              value: "details",
              heading: "Organisation details",
              summary: checklist.profileComplete
                ? [profile.legalName, facilityTypeLabel, stateLabel]
                    .filter(Boolean)
                    .join(", ")
                : "Some required details are missing",
              complete: checklist.profileComplete,
              action: isAlreadySubmitted
                ? undefined
                : linkToStep("details", "Edit organisation details"),
              children: (
                <SummaryDetailList
                  details={[
                    { label: "Registered name", value: profile.legalName },
                    { label: "Trading name", value: profile.tradingName },
                    { label: "Facility type", value: facilityTypeLabel },
                    { label: "CAC number", value: profile.cacNumber },
                    { label: "Email address", value: profile.email },
                    { label: "Phone number", value: profile.phone },
                    { label: "Address", value: address },
                    {
                      label: "Facility licence number",
                      value: profile.facilityLicenceNo,
                    },
                  ]}
                />
              ),
            },
            {
              value: "verification",
              heading: "Account verification",
              summary: `${completeCheckCount} of ${verificationChecks.length} checks complete`,
              complete: isVerificationComplete,
              action: isAlreadySubmitted
                ? undefined
                : linkToStep(
                    "verification",
                    isVerificationComplete
                      ? "View account verification"
                      : "Finish account verification"
                  ),
              children: <SummaryChecks checks={verificationChecks} />,
            },
            {
              value: "documents",
              heading: "Supporting documents",
              summary:
                requiredDocuments.length === 0
                  ? "No documents are required"
                  : `${requiredDocuments.length - missingRequiredDocuments.length} of ${requiredDocuments.length} required documents added`,
              complete: checklist.documentsComplete,
              action: isAlreadySubmitted
                ? undefined
                : linkToStep(
                    "documents",
                    checklist.documentsComplete
                      ? "Edit supporting documents"
                      : "Finish supporting documents"
                  ),
              children:
                documentFiles.length > 0 ? (
                  <SummaryFiles files={documentFiles} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No supporting documents are required.
                  </p>
                ),
            },
          ]}
        />

        {!isAlreadySubmitted && (
          <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="#onboarding-content"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                onBack();
              }}
            >
              <ChevronLeftIcon aria-hidden="true" className="size-4 shrink-0" />
              Back to supporting documents
            </a>
            <ActionButton
              type="button"
              size="large"
              isLoading={submitMutation.isPending}
              loadingText="Submitting application"
              disabled={submitMutation.isSuccess}
              onClick={submitApplication}
            >
              Submit application for review
            </ActionButton>
          </div>
        )}
      </div>

      <ApplicationLauncherDialog
        open={isLauncherOpen}
        onOpenChange={setIsLauncherOpen}
        title="Choose a product"
        description="Open a product you selected when you registered. Products you did not select are shown for reference."
        applications={launcherApplications}
      />
      <FeedbackDialog
        open={submissionFeedback === "success"}
        onOpenChange={(open) => !open && setSubmissionFeedback(null)}
        tone="success"
        title="Application submitted"
        description="HealthAlyst has received your organisation application. We will review your details and documents and let you know the outcome."
        primaryAction={{
          label: "Done",
          onSelect: () => setSubmissionFeedback(null),
        }}
      />
      <FeedbackDialog
        open={submissionFeedback === "error"}
        onOpenChange={(open) => !open && setSubmissionFeedback(null)}
        tone="error"
        title="We could not submit your application"
        description={
          submitMutation.error?.message ??
          "Something went wrong while submitting. Try again."
        }
        primaryAction={{
          label: "Try again",
          onSelect: submitApplication,
          isLoading: submitMutation.isPending,
          loadingText: "Submitting application",
        }}
        secondaryAction={{
          label: "Close",
          onSelect: () => setSubmissionFeedback(null),
        }}
      />
    </div>
  );
}
