"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ONBOARDING_STEP_QUERY_PARAMETER,
  ORGANIZATION_ONBOARDING_STEPS,
  type OrganizationOnboardingStepIdentifier,
} from "~/features/organization-application/config/organization-onboarding-steps";

const DEFAULT_ONBOARDING_STEP: OrganizationOnboardingStepIdentifier = "details";

function isOnboardingStep(
  value: string | null
): value is OrganizationOnboardingStepIdentifier {
  return ORGANIZATION_ONBOARDING_STEPS.some(
    (step) => step.identifier === value
  );
}

/**
 * The onboarding step kept in the address, so a refresh, a shared link or the
 * browser's back button returns to the same step.
 */
export function useOnboardingStep() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParameters = useSearchParams();
  const requestedStep = searchParameters.get(ONBOARDING_STEP_QUERY_PARAMETER);
  const currentStep = isOnboardingStep(requestedStep)
    ? requestedStep
    : DEFAULT_ONBOARDING_STEP;

  const goToStep = useCallback(
    (step: OrganizationOnboardingStepIdentifier) => {
      const nextSearchParameters = new URLSearchParams(
        searchParameters.toString()
      );
      if (step === DEFAULT_ONBOARDING_STEP) {
        nextSearchParameters.delete(ONBOARDING_STEP_QUERY_PARAMETER);
      } else {
        nextSearchParameters.set(ONBOARDING_STEP_QUERY_PARAMETER, step);
      }
      const query = nextSearchParameters.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}#onboarding-content`);
    },
    [pathname, router, searchParameters]
  );

  return { currentStep, goToStep };
}
