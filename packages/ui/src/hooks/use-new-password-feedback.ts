"use client";

import { useState } from "react";
import {
  describeNewPassword,
  type PasswordLengthLimits,
} from "@healthalyst/ui/forms/new-password-feedback";
import type { FieldStatus } from "@healthalyst/ui/types/field-status";

type NewPasswordFieldNames = {
  password: string;
  confirmation: string;
};

/**
 * Tracks a new password and its confirmation as they are typed, and returns
 * live errors and statuses keyed by field name for the form to show.
 */
export function useNewPasswordFeedback({
  fieldNames,
  limits,
}: {
  fieldNames: NewPasswordFieldNames;
  limits: PasswordLengthLimits;
}) {
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

  /**
   * Marks a field as left; call it when focus leaves the whole field. Passing
   * through an empty field does not count, so its errors wait for typing.
   */
  function handleFieldBlur(fieldName: string) {
    const key = fieldKey(fieldName);
    if (key && values[key] !== "") {
      setVisitedFields((currentFields) => ({ ...currentFields, [key]: true }));
    }
  }

  const feedback = describeNewPassword({
    password: values.password,
    confirmation: values.confirmation,
    passwordVisited: visitedFields.password,
    confirmationVisited: visitedFields.confirmation,
    limits,
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
