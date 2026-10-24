"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { registrationSteps } from "~/features/organization-registration/config/organization-registration-form-definition";
import { useOrganizationRegistrationMutation } from "~/features/organization-registration/hooks/use-organization-registration";
import { registrationSchema } from "~/features/organization-registration/schemas/organization-registration-schema";
import type { PendingStepFocus } from "~/features/organization-registration/types/registration-step";
import { findFirstStepIndexWithErrors } from "~/features/organization-registration/utilities/registration-step-errors";
import { clearRegistrationFieldErrors } from "~/features/organization-registration/utilities/registration-field-errors";
import {
  focusFirstInvalidField,
  parseFormData,
  pickFieldErrors,
} from "~/shared/forms/form-validation";
const FINAL_STEP_INDEX = registrationSteps.length - 1;
export function useOrganizationRegistrationWorkflow() {
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

  return {
    fieldErrors,
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
  };
}
