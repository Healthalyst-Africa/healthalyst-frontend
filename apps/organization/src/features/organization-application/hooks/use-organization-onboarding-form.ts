"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  ORGANIZATION_PROFILE_FIELD_NAMES,
  ORGANIZATION_PROFILE_REQUIRED_FIELD_NAMES,
} from "~/features/organization-application/config/organization-application";
import { organizationOnboardingFormSchema } from "~/features/organization-application/schemas/organization-onboarding-form-schema";
import { useOrganizationApplicationUpdateMutation } from "~/features/organization-application/hooks/use-organization-application";
import {
  getOrganizationOnboardingChanges,
  mergeOrganizationOnboardingDraft,
  toOrganizationOnboardingFormValues,
} from "~/features/organization-application/utilities/organization-onboarding-form";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";

export function useOrganizationOnboardingForm({
  application,
  organizationId,
  userId,
  reloadApplication,
  onContinue,
}: {
  application: OrganizationApplication;
  organizationId: string;
  userId: string;
  reloadApplication: () => Promise<OrganizationApplication | undefined>;
  onContinue: () => void;
}) {
  const [values, setValues] = useState(() =>
    toOrganizationOnboardingFormValues(application.profile)
  );
  const [savedApplication, setSavedApplication] = useState(application);
  const savedValues = toOrganizationOnboardingFormValues(
    savedApplication.profile
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState("");
  const [reloadError, setReloadError] = useState("");
  const [isReloading, setIsReloading] = useState(false);
  const submissionInFlightReference = useRef(false);
  const formReference = useRef<HTMLFormElement>(null);
  const updateMutation = useOrganizationApplicationUpdateMutation({
    organizationId,
    userId,
  });
  const hasChanges = ORGANIZATION_PROFILE_FIELD_NAMES.some(
    (fieldName) => values[fieldName] !== savedValues[fieldName]
  );
  const hasConflict =
    updateMutation.error instanceof PlatformApiError &&
    updateMutation.error.status === 409;

  useEffect(() => {
    if (!hasChanges || !application.canEdit) return;
    function warnBeforeLeaving(browserEvent: BeforeUnloadEvent) {
      browserEvent.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasChanges, application.canEdit]);

  function changeValue(fieldName: string, value: string) {
    setValues((currentValues) => ({ ...currentValues, [fieldName]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [fieldName]: "" }));
    setSaveMessage("");
  }

  function focusFirstError() {
    window.requestAnimationFrame(() =>
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
    );
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (
      !application.canEdit ||
      submissionInFlightReference.current ||
      hasConflict
    )
      return;
    // Empty required fields are left out rather than blocking the save;
    // anything entered must still be valid.
    const emptyRequiredFieldNames =
      ORGANIZATION_PROFILE_REQUIRED_FIELD_NAMES.filter(
        (fieldName) => !values[fieldName].trim()
      );
    const draftValues = Object.fromEntries(
      Object.entries(values).filter(
        ([fieldName]) =>
          !emptyRequiredFieldNames.some(
            (emptyFieldName) => emptyFieldName === fieldName
          )
      )
    );
    const validatedValues = organizationOnboardingFormSchema
      .partial()
      .safeParse(draftValues);
    if (!validatedValues.success) {
      setFieldErrors(
        Object.fromEntries(
          validatedValues.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ])
        )
      );
      focusFirstError();
      return;
    }
    const changedFieldNames = ORGANIZATION_PROFILE_FIELD_NAMES.filter(
      (fieldName) =>
        values[fieldName] !== savedValues[fieldName] &&
        !emptyRequiredFieldNames.some(
          (emptyFieldName) => emptyFieldName === fieldName
        )
    );
    const changes = getOrganizationOnboardingChanges(
      savedApplication.profile,
      validatedValues.data,
      changedFieldNames
    );
    if (!changes) {
      setValues(savedValues);
      onContinue();
      return;
    }
    if (!savedApplication.entityTag) {
      setReloadError("Reload your organisation details before saving.");
      return;
    }
    setFieldErrors({});
    setSaveMessage("");
    submissionInFlightReference.current = true;
    updateMutation.mutate(
      { entityTag: savedApplication.entityTag, changes },
      {
        onSuccess: (updatedApplication) => {
          const updatedValues = toOrganizationOnboardingFormValues(
            updatedApplication.profile
          );
          setValues(updatedValues);
          setSavedApplication(updatedApplication);
          setSaveMessage(
            updatedApplication.checklist.profileComplete
              ? "Organisation details saved."
              : "Details saved. Some required details are still missing."
          );
          onContinue();
        },
        onError: (error) => {
          if (error instanceof PlatformApiError) {
            setFieldErrors({ ...error.fieldErrors });
            focusFirstError();
          }
        },
        onSettled: () => {
          submissionInFlightReference.current = false;
        },
      }
    );
  }

  async function reloadLatestDetails() {
    setIsReloading(true);
    setReloadError("");
    try {
      const latestApplication = await reloadApplication();
      if (!latestApplication)
        throw new Error(
          "We could not reload your organisation details. Try again."
        );
      const latestValues = toOrganizationOnboardingFormValues(
        latestApplication.profile
      );
      setValues(
        mergeOrganizationOnboardingDraft(latestValues, savedValues, values)
      );
      setSavedApplication(latestApplication);
      updateMutation.reset();
      setSaveMessage(
        "Latest details loaded. Your edits have been kept. Review them before saving."
      );
    } catch (error) {
      setReloadError(
        error instanceof Error
          ? error.message
          : "We could not reload your details."
      );
    } finally {
      setIsReloading(false);
    }
  }

  function discardChanges() {
    setValues(savedValues);
    setFieldErrors({});
    setSaveMessage("");
    updateMutation.reset();
  }

  return {
    values,
    fieldErrors,
    formReference,
    hasChanges,
    hasConflict,
    saveMessage,
    reloadError,
    isReloading,
    updateMutation,
    changeValue,
    handleSubmit,
    reloadLatestDetails,
    discardChanges,
  };
}
