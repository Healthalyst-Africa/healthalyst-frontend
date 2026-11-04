"use client";

import { useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { TextField } from "@healthalyst/ui/components/text-field";
import {
  CURRENT_PASSWORD_MAXIMUM_LENGTH,
  INVALID_CURRENT_PASSWORD_ERROR_CODE,
} from "~/features/account-security/config/account-security";
import { isStepUpRequiredError } from "~/features/account-security/hooks/use-step-up-protection";
import { passwordChangeSchema } from "~/features/account-security/schemas/password-change-schema";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";
import { usePasswordChangeMutation } from "~/features/authentication/hooks/use-platform-authentication";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

/** Field errors the API returned for the password change. */
function readServerFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof PlatformApiError)) return {};
  if (error.code === INVALID_CURRENT_PASSWORD_ERROR_CODE) {
    return { currentPassword: "Your current password is not correct." };
  }
  return { ...error.fieldErrors };
}

export function PasswordChangeSection({
  runProtected,
  onPasswordChanged,
}: {
  runProtected: (action: {
    description: string;
    run: () => Promise<unknown>;
  }) => Promise<boolean>;
  onPasswordChanged: () => void;
}) {
  const passwordChangeMutation = usePasswordChangeMutation();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const serverFieldErrors = readServerFieldErrors(passwordChangeMutation.error);
  const visibleFieldErrors = { ...serverFieldErrors, ...fieldErrors };
  const generalError =
    passwordChangeMutation.error &&
    !isStepUpRequiredError(passwordChangeMutation.error) &&
    Object.keys(serverFieldErrors).length === 0
      ? passwordChangeMutation.error.message
      : "";

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const validationResult = parseFormData(
      passwordChangeSchema,
      new FormData(formElement)
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formElement, validationResult.errors);
      return;
    }
    setFieldErrors({});
    const { currentPassword, newPassword } = validationResult.data;
    void runProtected({
      description: "change your password",
      run: () =>
        passwordChangeMutation.mutateAsync(
          { currentPassword, newPassword },
          {
            onSuccess: () => {
              formElement.reset();
              onPasswordChanged();
            },
            onError: (error) => {
              const errors = readServerFieldErrors(error);
              if (Object.keys(errors).length > 0) {
                focusFirstInvalidField(formElement, errors);
              }
            },
          }
        ),
    });
  }

  function clearFeedback() {
    setFieldErrors({});
    if (passwordChangeMutation.isError || passwordChangeMutation.isSuccess) {
      passwordChangeMutation.reset();
    }
  }

  return (
    <ContentPanel
      heading="Password"
      description="Changing your password signs you out on your other devices."
      spacing="compact"
    >
      <form
        className="flex max-w-md flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        <TextField
          autoComplete="current-password"
          id="current-password"
          label="Current password"
          name="currentPassword"
          type="password"
          maxLength={CURRENT_PASSWORD_MAXIMUM_LENGTH}
          required
          disabled={passwordChangeMutation.isPending}
          error={visibleFieldErrors.currentPassword}
          onChange={clearFeedback}
        />
        <TextField
          autoComplete="new-password"
          id="new-password"
          label="New password"
          name="newPassword"
          type="password"
          description={`Use at least ${PASSWORD_LIMITS.minimum} characters.`}
          maxLength={PASSWORD_LIMITS.maximum}
          required
          disabled={passwordChangeMutation.isPending}
          error={visibleFieldErrors.newPassword}
          onChange={clearFeedback}
        />
        <TextField
          autoComplete="new-password"
          id="confirm-new-password"
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          maxLength={PASSWORD_LIMITS.maximum}
          required
          disabled={passwordChangeMutation.isPending}
          error={visibleFieldErrors.confirmPassword}
          onChange={clearFeedback}
        />
        {generalError && <FormMessage tone="error">{generalError}</FormMessage>}
        {passwordChangeMutation.isSuccess && (
          <FormMessage tone="success">
            Your password has been changed. You were signed out on your other
            devices.
          </FormMessage>
        )}
        <ActionButton
          className="self-start"
          type="submit"
          isLoading={passwordChangeMutation.isPending}
          loadingText="Changing password"
        >
          Change password
        </ActionButton>
      </form>
    </ContentPanel>
  );
}
