import { OnboardingProgress } from "@healthalyst/ui/components/onboarding-progress";
import { Skeleton } from "@healthalyst/ui/components/skeleton";
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
      <div className="flex flex-col gap-5" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
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
