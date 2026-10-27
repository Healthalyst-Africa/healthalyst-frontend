"use client";

import { useOrganizationRegistrationWorkflow } from "~/features/organization-registration/hooks/use-organization-registration-workflow";
import { ChevronLeftIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DynamicFormFields } from "@healthalyst/ui/components/dynamic-form-fields";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { cn } from "@healthalyst/ui/lib/utilities";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { getOrganizationRegistrationSiteKey } from "@healthalyst/config/environment";
import RegistrationConfirmation from "~/features/organization-registration/components/registration-confirmation";
import TurnstileChallenge from "~/features/organization-registration/components/turnstile-challenge";
import { registrationSteps } from "~/features/organization-registration/config/organization-registration-form-definition";
import type { OrganizationProduct } from "~/features/organization-registration/types/organization-product";

/**
 * Organisation registration against the Platform API
 * (`POST /v1/onboarding/registrations`), split into steps.
 *
 * Every step stays mounted and is only hidden, so one form submits all the
 * values at the end. Each step is checked before moving on, and the whole
 * schema is checked again on submission.
 */
export default function OrganizationRegistrationForm({
  initialProducts = [],
}: {
  /** Products to pre-select, for example from the product app a visitor came from. */
  initialProducts?: readonly OrganizationProduct[];
}) {
  const {
    fieldErrors,
    fieldStatuses,
    handleFieldValueChange,
    handleFieldBlur,
    currentStepIndex,
    captchaToken,
    captchaChallengeKey,
    cardReference,
    formReference,
    stepHeadingReference,
    registrationMutation,
    registrationError,
    isSubmitting,
    isFinalStep,
    administratorEmailAddress,
    handleCaptchaTokenChange,
    showStep,
    handleFieldChange,
    handleRegistrationSubmit,
  } = useOrganizationRegistrationWorkflow();

  if (registrationMutation.isSuccess) {
    return (
      <RegistrationConfirmation emailAddress={administratorEmailAddress} />
    );
  }

  const currentStep = registrationSteps[currentStepIndex];

  // The step count sits above the card, which scrolls within its own border
  // on large screens. Screen readers hear the count in the step heading.
  return (
    <div className="flex flex-col gap-3 lg:min-h-0">
      <div className="flex min-h-9 items-center justify-between gap-3">
        {currentStepIndex > 0 ? (
          <ActionButton
            className="-ml-3"
            size="small"
            type="button"
            variant="ghost"
            leadingIcon={<ChevronLeftIcon />}
            disabled={isSubmitting}
            onClick={() =>
              showStep(currentStepIndex - 1, { kind: "step-heading" })
            }
          >
            Back
          </ActionButton>
        ) : (
          <span aria-hidden="true" />
        )}
        <p aria-hidden="true" className="px-1 text-xs text-muted-foreground">
          Step {currentStepIndex + 1} of {registrationSteps.length}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2
          ref={stepHeadingReference}
          id={`organization-registration-${currentStep?.identifier}-heading`}
          className="font-serif text-title font-normal outline-none"
          tabIndex={-1}
        >
          <span className="sr-only">
            {`Step ${currentStepIndex + 1} of ${registrationSteps.length}: `}
          </span>
          {currentStep?.heading}
        </h2>
        {currentStep?.description && (
          <p className="text-lede text-muted-foreground">
            {currentStep.description}
          </p>
        )}
      </div>
      <ContentPanel
        frame="wide-screens"
        ref={cardReference}
        className="lg:relative lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
        contentClassName="gap-6"
      >
        <form
          ref={formReference}
          className="flex flex-col gap-6"
          onSubmit={handleRegistrationSubmit}
          noValidate
        >
          {registrationSteps.map((step, stepIndex) => {
            const isCurrentStep = stepIndex === currentStepIndex;
            const headingIdentifier = `organization-registration-${step.identifier}-heading`;

            return (
              <section
                key={step.identifier}
                aria-labelledby={headingIdentifier}
                className={cn(isCurrentStep ? "flex flex-col gap-6" : "hidden")}
                hidden={!isCurrentStep}
              >
                {step.definitions.map((definition) => (
                  <DynamicFormFields
                    key={definition.sections
                      .map((section) => section.identifier)
                      .join(" ")}
                    definition={definition}
                    defaultSelections={{ products: initialProducts }}
                    errors={fieldErrors}
                    statuses={fieldStatuses}
                    disabled={isSubmitting}
                    onFieldChange={handleFieldChange}
                    onValueChange={handleFieldValueChange}
                    onFieldBlur={handleFieldBlur}
                  />
                ))}
              </section>
            );
          })}

          {registrationError && (
            <FormMessage
              tone="error"
              details={
                registrationError instanceof PlatformApiError &&
                registrationError.requestId && (
                  <p className="text-xs text-muted-foreground">
                    Reference for HealthAlyst support:{" "}
                    <span className="font-mono">
                      {registrationError.requestId}
                    </span>
                  </p>
                )
              }
            >
              {registrationError.message}
            </FormMessage>
          )}

          <div className="flex flex-col gap-4">
            {isFinalStep && (
              <TurnstileChallenge
                key={captchaChallengeKey}
                onResponseTokenChange={handleCaptchaTokenChange}
                siteKey={getOrganizationRegistrationSiteKey()}
              />
            )}
            {isFinalStep && (
              <p className="text-xs leading-5 text-muted-foreground">
                By registering, you confirm that you are authorised to act for
                this organisation.
              </p>
            )}
            <div className="flex">
              <ActionButton
                className="w-full"
                size="large"
                type="submit"
                isLoading={isSubmitting}
                loadingText="Registering organisation"
                disabled={isSubmitting || (isFinalStep && !captchaToken)}
              >
                {currentStep?.actionLabel}
              </ActionButton>
            </div>
          </div>
        </form>
      </ContentPanel>
    </div>
  );
}
