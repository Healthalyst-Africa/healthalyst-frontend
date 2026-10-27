import {
  OnboardingProgress,
  type OnboardingProgressStep,
} from "@healthalyst/ui/components/onboarding-progress";
import { OnboardingProgressSummary } from "@healthalyst/ui/components/onboarding-progress-summary";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";
import {
  ONBOARDING_STEP_QUERY_PARAMETER,
  ORGANIZATION_ONBOARDING_STEPS,
  type OrganizationOnboardingStepIdentifier,
} from "~/features/organization-application/config/organization-onboarding-steps";

const PROGRESS_LABEL = "Your organisation setup";

type OrganizationOnboardingProgressProperties = {
  application?: OrganizationApplication;
  currentStep: OrganizationOnboardingStepIdentifier;
  /** Opens a step; steps are only links while the application can change. */
  onStepSelect: (step: OrganizationOnboardingStepIdentifier) => void;
};

function buildProgressSteps({
  application,
  currentStep,
  onStepSelect,
}: OrganizationOnboardingProgressProperties & {
  application: OrganizationApplication;
}): OnboardingProgressStep[] {
  return ORGANIZATION_ONBOARDING_STEPS.map((step) => ({
    ...step,
    complete:
      step.identifier === "details"
        ? application.checklist.profileComplete
        : step.identifier === "verification"
          ? // Phone verification is optional.
            application.checklist.emailVerified &&
            application.checklist.mfaEnrolled
          : step.identifier === "documents"
            ? application.checklist.documentsComplete
            : Boolean(application.submittedAt) &&
              application.status !== "CHANGES_REQUESTED",
    current: step.identifier === currentStep,
    // Onboarding never blocks moving between steps while it can be edited.
    ...(application.canEdit && {
      href: `?${ONBOARDING_STEP_QUERY_PARAMETER}=${step.identifier}#onboarding-content`,
      onSelect: () => onStepSelect(step.identifier),
    }),
  }));
}

/** The full step list beside the content on large screens. */
export function OrganizationOnboardingProgress({
  application,
  ...properties
}: OrganizationOnboardingProgressProperties) {
  if (!application) {
    return (
      <LoadingPlaceholder
        label="Loading your organisation setup progress"
        rows={[
          { shape: "text", width: "short" },
          { shape: "rule" },
          { shape: "card" },
          { shape: "card" },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <OnboardingProgress
        label={PROGRESS_LABEL}
        steps={buildProgressSteps({ application, ...properties })}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        Onboarding asks for organisation details only. Do not upload patient
        records or medical information.
      </p>
    </div>
  );
}

/** The current step and a segmented bar, pinned on small screens. */
export function OrganizationOnboardingProgressSummary({
  application,
  ...properties
}: OrganizationOnboardingProgressProperties) {
  if (!application) {
    return (
      <LoadingPlaceholder
        label="Loading your organisation setup progress"
        rows={[{ shape: "text", width: "short" }, { shape: "rule" }]}
      />
    );
  }

  return (
    <OnboardingProgressSummary
      label={PROGRESS_LABEL}
      steps={buildProgressSteps({ application, ...properties })}
    />
  );
}
