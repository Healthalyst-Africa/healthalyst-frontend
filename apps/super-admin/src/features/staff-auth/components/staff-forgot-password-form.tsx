"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { TextField } from "@healthalyst/ui/components/text-field";
import { StaffAuthLayout } from "~/features/staff-auth/components/staff-auth-layout";
import { StaffSignInLink } from "~/features/staff-auth/components/staff-sign-in-link";
import { STAFF_EMAIL_ADDRESS_MAXIMUM_LENGTH } from "~/features/staff-auth/config/staff-password-recovery";
import { useStaffPasswordResetRequestMutation } from "~/features/staff-auth/hooks/use-staff-password-recovery";
import { staffPasswordResetRequestSchema } from "~/features/staff-auth/schemas/staff-password-recovery-schema";

export function StaffForgotPasswordForm() {
  const [emailAddressError, setEmailAddressError] = useState("");
  const headingReference = useRef<HTMLHeadingElement>(null);
  const passwordResetRequestMutation = useStaffPasswordResetRequestMutation();

  useEffect(() => {
    if (passwordResetRequestMutation.isSuccess) {
      headingReference.current?.focus();
    }
  }, [passwordResetRequestMutation.isSuccess]);

  function handlePasswordResetRequest(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const validationResult = staffPasswordResetRequestSchema.safeParse({
      emailAddress: new FormData(formElement).get("emailAddress"),
    });
    if (!validationResult.success) {
      setEmailAddressError(
        validationResult.error.issues[0]?.message ??
          "Enter a valid work email address."
      );
      formElement
        .querySelector<HTMLInputElement>('[name="emailAddress"]')
        ?.focus();
      return;
    }

    setEmailAddressError("");
    passwordResetRequestMutation.mutate(validationResult.data.emailAddress);
  }

  function clearEmailAddressFeedback() {
    setEmailAddressError("");
    if (
      passwordResetRequestMutation.isError ||
      passwordResetRequestMutation.isSuccess
    ) {
      passwordResetRequestMutation.reset();
    }
  }

  return (
    <StaffAuthLayout
      title="Forgot your password?"
      description="Enter your HealthAlyst staff email address and we will send reset instructions if it matches an account."
      headingReference={headingReference}
      footer={<StaffSignInLink />}
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={handlePasswordResetRequest}
        noValidate
      >
        <TextField
          autoComplete="email"
          id="staff-password-reset-email-address"
          label="Work email address"
          name="emailAddress"
          type="email"
          maxLength={STAFF_EMAIL_ADDRESS_MAXIMUM_LENGTH}
          required
          disabled={passwordResetRequestMutation.isPending}
          error={emailAddressError}
          onChange={clearEmailAddressFeedback}
        />

        {passwordResetRequestMutation.isSuccess && (
          <FormMessage tone="status">
            If an account matches that email address, password reset
            instructions are on their way. The link expires in 30 minutes, so
            check your inbox and spam folder soon.
          </FormMessage>
        )}

        {passwordResetRequestMutation.error && (
          <FormMessage tone="error">
            {passwordResetRequestMutation.error.message}
          </FormMessage>
        )}

        <ActionButton
          className="w-full"
          size="large"
          type="submit"
          isLoading={passwordResetRequestMutation.isPending}
          loadingText="Sending instructions"
        >
          Send password reset instructions
        </ActionButton>
      </form>
    </StaffAuthLayout>
  );
}
