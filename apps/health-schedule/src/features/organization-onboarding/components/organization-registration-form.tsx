"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ChevronLeftIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DynamicFormFields } from "@healthalyst/ui/components/dynamic-form-fields";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import { FieldError } from "@healthalyst/ui/components/field";
import { cn } from "@healthalyst/ui/lib/utilities";
import { PlatformApiError } from "~/features/organization-onboarding/api/platform-api-error";
import RegistrationConfirmation from "~/features/organization-onboarding/components/registration-confirmation";
import TurnstileChallenge from "~/features/organization-onboarding/components/turnstile-challenge";
import {
  findFirstStepIndexWithErrors,
  registrationSteps,
} from "~/features/organization-onboarding/components/organization-registration-form-definition";
import { useOrganizationRegistrationMutation } from "~/features/organization-onboarding/hooks/use-organization-registration";
import {
  clearRegistrationFieldErrors,
  registrationSchema,
} from "~/features/organization-onboarding/model/organization-registration-schema";
import {
  focusFirstInvalidField,
  parseFormData,
  pickFieldErrors,
} from "~/shared/forms/form-validation";

const FINAL_STEP_INDEX = registrationSteps.length - 1;

/** What receives focus once a newly shown step has rendered. */
type PendingStepFocus =
  | { kind: "step-heading" }
  | { kind: "invalid-field"; errors: Record<string, string> };

/**
 * Organisation registration against the Platform API
 * (`POST /v1/onboarding/registrations`), split into steps.
 *
 * Every step stays mounted and is only hidden, so one form submits all the
 * values at the end. Each step is checked before moving on, and the whole
 * schema is checked again on submission.
 */
export default function OrganizationRegistrationForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaChallengeKey, setCaptchaChallengeKey] = useState(0);
  const cardReference = useRef<HTMLDivElement>(null);
  const formReference = useRef<HTMLFormElement>(null);
  const stepHeadingReference = useRef<HTMLHeadingElement>(null);
  const pendingStepFocusReference = useRef<PendingStepFocus | null>(null);
  const registrationMutation = useOrganizationRegistrationMutation();
  const registrationError = registrationMutation.error;
  const isSubmitting = registrationMutation.isPending;
  const isFinalStep = currentStepIndex === FINAL_STEP_INDEX;
  const administratorEmailAddress =
    registrationMutation.variables?.admin.email ?? "";

  const handleCaptchaTokenChange = useCallback(
    (responseToken: string | null) => {
      setCaptchaToken(responseToken);
    },
    []
  );

  function applyStepFocus(stepFocus: PendingStepFocus) {
    if (stepFocus.kind === "invalid-field") {
      if (formReference.current) {
        focusFirstInvalidField(formReference.current, stepFocus.errors);
      }
      return;
    }
    cardReference.current?.scrollTo({ top: 0 });
    stepHeadingReference.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const pendingStepFocus = pendingStepFocusReference.current;
    if (!pendingStepFocus) return;
    pendingStepFocusReference.current = null;
    applyStepFocus(pendingStepFocus);
  }, [currentStepIndex]);

  function showStep(stepIndex: number, stepFocus: PendingStepFocus) {
    if (stepIndex !== FINAL_STEP_INDEX) {
      setCaptchaToken(null);
    }
    if (stepIndex === currentStepIndex) {
      applyStepFocus(stepFocus);
      return;
    }
    pendingStepFocusReference.current = stepFocus;
    setCurrentStepIndex(stepIndex);
  }

  /** Shows every error, then opens the earliest step that has one. */
  function showFieldErrors(errors: Record<string, string>) {
    setFieldErrors(errors);
    const stepIndex = findFirstStepIndexWithErrors(errors);
    if (stepIndex === undefined) return;
    showStep(stepIndex, {
      kind: "invalid-field",
      errors: pickFieldErrors(
        errors,
        registrationSteps[stepIndex]?.fieldNames ?? []
      ),
    });
  }

  function handleFieldChange(fieldName: string) {
    setFieldErrors((currentErrors) =>
      clearRegistrationFieldErrors(currentErrors, fieldName)
    );
    registrationMutation.reset();
  }

  function handleRegistrationSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const validationResult = parseFormData(
      registrationSchema,
      new FormData(formEvent.currentTarget)
    );

    if (!isFinalStep) {
      const stepErrors = validationResult.success
        ? {}
        : pickFieldErrors(
            validationResult.errors,
            registrationSteps[currentStepIndex]?.fieldNames ?? []
          );
      setFieldErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) {
        showStep(currentStepIndex, {
          kind: "invalid-field",
          errors: stepErrors,
        });
        return;
      }
      showStep(currentStepIndex + 1, { kind: "step-heading" });
      return;
    }

    registrationMutation.reset();
    if (!validationResult.success) {
      showFieldErrors(validationResult.errors);
      return;
    }

    if (!captchaToken) {
      return;
    }

    setFieldErrors({});
    registrationMutation.mutate(
      { ...validationResult.data, captchaToken },
      {
        onError: (error) => {
          if (
            error instanceof PlatformApiError &&
            Object.keys(error.fieldErrors).length > 0
          ) {
            showFieldErrors({ ...error.fieldErrors });
          }
        },
        onSettled: () => {
          setCaptchaToken(null);
          setCaptchaChallengeKey((currentKey) => currentKey + 1);
        },
      }
    );
  }

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
        <p aria-hidden="true" className="px-1 text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {registrationSteps.length}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2
          ref={stepHeadingReference}
          id={`organization-registration-${currentStep?.identifier}-heading`}
          className="font-serif text-3xl font-normal leading-tight outline-none"
          tabIndex={-1}
        >
          <span className="sr-only">
            {`Step ${currentStepIndex + 1} of ${registrationSteps.length}: `}
          </span>
          {currentStep?.heading}
        </h2>
        {currentStep?.description && (
          <p className="text-sm leading-6 text-muted-foreground">
            {currentStep.description}
          </p>
        )}
      </div>
      <Card
        ref={cardReference}
        className="registration-scroll-area border-border bg-card shadow-sm lg:relative lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
      >
        <CardContent className="flex flex-col gap-6 px-6 py-7 md:px-8 md:py-8">
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
                  className={cn(
                    isCurrentStep ? "flex flex-col gap-6" : "hidden"
                  )}
                  hidden={!isCurrentStep}
                >
                  {step.definitions.map((definition) => (
                    <DynamicFormFields
                      key={definition.sections
                        .map((section) => section.identifier)
                        .join(" ")}
                      definition={definition}
                      errors={fieldErrors}
                      disabled={isSubmitting}
                      onFieldChange={handleFieldChange}
                    />
                  ))}
                </section>
              );
            })}

            {registrationError && (
              <div className="flex flex-col gap-1" role="alert">
                <FieldError>{registrationError.message}</FieldError>
                {registrationError instanceof PlatformApiError &&
                  registrationError.requestId && (
                    <p className="text-xs text-muted-foreground">
                      Reference for HealthAlyst support:{" "}
                      <span className="font-mono">
                        {registrationError.requestId}
                      </span>
                    </p>
                  )}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {isFinalStep && (
                <TurnstileChallenge
                  key={captchaChallengeKey}
                  onResponseTokenChange={handleCaptchaTokenChange}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
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
        </CardContent>
      </Card>
    </div>
  );
}
