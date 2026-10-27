"use client";

import { useState } from "react";
import type { FieldStatus } from "@healthalyst/ui/components/dynamic-form-fields";
import { describeNewPassword } from "~/features/authentication/utilities/describe-new-password";

type NewPasswordFieldNames = {
  password: string;
  confirmation: string;
};

/**
 * Tracks a new password and its confirmation as they are typed, and returns
 * live errors and statuses keyed by field name for the form to show.
 */
export function useNewPasswordFeedback(fieldNames: NewPasswordFieldNames) {
  const [values, setValues] = useState({ password: "", confirmation: "" });
  const [visitedFields, setVisitedFields] = useState({
    password: false,
    confirmation: false,
  });

  function fieldKey(fieldName: string): keyof typeof values | undefined {
    if (fieldName === fieldNames.password) return "password";
    if (fieldName === fieldNames.confirmation) return "confirmation";
    return undefined;
  }

  function handleValueChange(fieldName: string, value: string) {
    const key = fieldKey(fieldName);
    if (key) setValues((currentValues) => ({ ...currentValues, [key]: value }));
  }

  function handleFieldBlur(fieldName: string) {
    const key = fieldKey(fieldName);
    if (key) {
      setVisitedFields((currentFields) => ({ ...currentFields, [key]: true }));
    }
  }

  const feedback = describeNewPassword({
    password: values.password,
    confirmation: values.confirmation,
    passwordVisited: visitedFields.password,
    confirmationVisited: visitedFields.confirmation,
  });
  const errors: Record<string, string> = {};
  const statuses: Record<string, FieldStatus> = {};
  if (feedback.passwordError)
    errors[fieldNames.password] = feedback.passwordError;
  if (feedback.confirmationError) {
    errors[fieldNames.confirmation] = feedback.confirmationError;
  }
  if (feedback.passwordStatus) {
    statuses[fieldNames.password] = feedback.passwordStatus;
  }
  if (feedback.confirmationStatus) {
    statuses[fieldNames.confirmation] = feedback.confirmationStatus;
  }

  return { errors, statuses, handleValueChange, handleFieldBlur };
}
