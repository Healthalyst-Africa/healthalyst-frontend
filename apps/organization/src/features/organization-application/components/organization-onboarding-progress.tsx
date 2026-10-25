import { OnboardingProgress } from "@healthalyst/ui/components/onboarding-progress";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";
import {
  ORGANIZATION_ONBOARDING_STEPS,
  type OrganizationOnboardingStepIdentifier,
} from "~/features/organization-application/config/organization-onboarding-steps";

export function OrganizationOnboardingProgress({
  application,
  currentStep,
}: {
  application?: OrganizationApplication;
  currentStep: OrganizationOnboardingStepIdentifier;
}) {
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
        label="Your organisation setup"
        steps={ORGANIZATION_ONBOARDING_STEPS.map((step) => ({
          ...step,
          complete:
            step.identifier === "details"
              ? application.checklist.profileComplete
              : step.identifier === "verification"
                ? application.checklist.emailVerified &&
                  application.checklist.phoneVerified &&
                  application.checklist.mfaEnrolled
                : step.identifier === "documents"
                  ? application.checklist.documentsComplete
                  : Boolean(application.submittedAt) &&
                    application.status !== "CHANGES_REQUESTED",
          current: step.identifier === currentStep,
        }))}
      />
      <p className="text-xs leading-5 text-muted-foreground">
        Onboarding asks for organisation details only. Do not upload patient
        records or medical information.
      </p>
    </div>
  );
}
