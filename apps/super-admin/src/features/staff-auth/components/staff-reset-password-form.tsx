"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { TextField } from "@healthalyst/ui/components/text-field";
import { useNewPasswordFeedback } from "@healthalyst/ui/hooks/use-new-password-feedback";
import { APPLICATION_ROUTES } from "~/config/application-routes";
import { StaffAuthLayout } from "~/features/staff-auth/components/staff-auth-layout";
import { StaffSignInLink } from "~/features/staff-auth/components/staff-sign-in-link";
import { STAFF_PASSWORD_LIMITS } from "~/features/staff-auth/config/staff-password-recovery";
import { useStaffPasswordResetMutation } from "~/features/staff-auth/hooks/use-staff-password-recovery";
import { staffPasswordResetSchema } from "~/features/staff-auth/schemas/staff-password-recovery-schema";
import { readOneTimeTokenFromAddress } from "~/features/staff-auth/utilities/read-one-time-token-from-address";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";

type PasswordFieldName = "newPassword" | "confirmPassword";

export function StaffResetPasswordForm() {
  // `undefined` while the address is being read; `null` when no token is present.
  const [resetToken, setResetToken] = useState<string | null | undefined>(
    undefined
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PasswordFieldName, string>>
  >({});
  const headingReference = useRef<HTMLHeadingElement>(null);
  const hasReadTokenReference = useRef(false);
  const { clearSession } = useStaffSession();
  const passwordResetMutation = useStaffPasswordResetMutation();
  const passwordFeedback = useNewPasswordFeedback({
    fieldNames: { password: "newPassword", confirmation: "confirmPassword" },
    limits: STAFF_PASSWORD_LIMITS,
  });

  useEffect(() => {
    if (hasReadTokenReference.current) return;
    hasReadTokenReference.current = true;
    setResetToken(readOneTimeTokenFromAddress() || null);
  }, []);

  useEffect(() => {
    if (passwordResetMutation.isSuccess) {
      headingReference.current?.focus();
    }
  }, [passwordResetMutation.isSuccess]);

  function handlePasswordReset(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!resetToken) return;

    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const validationResult = staffPasswordResetSchema.safeParse({
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!validationResult.success) {
      const nextFieldErrors: Partial<Record<PasswordFieldName, string>> = {};
      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0];
        if (
          (fieldName === "newPassword" || fieldName === "confirmPassword") &&
          !nextFieldErrors[fieldName]
        ) {
          nextFieldErrors[fieldName] = issue.message;
        }
      }
      setFieldErrors(nextFieldErrors);
      const firstInvalidFieldName = nextFieldErrors.newPassword
        ? "newPassword"
        : "confirmPassword";
      formElement
        .querySelector<HTMLInputElement>(`[name="${firstInvalidFieldName}"]`)
        ?.focus();
      return;
    }

    setFieldErrors({});
    passwordResetMutation.mutate(
      { token: resetToken, password: validationResult.data.newPassword },
      {
        onSuccess: () => {
          setResetToken(null);
          // The Platform API signs the account out everywhere after a reset.
          clearSession();
        },
      }
    );
  }

  function clearPasswordFeedback(fieldName: PasswordFieldName) {
    setFieldErrors((currentErrors) => ({ ...currentErrors, [fieldName]: "" }));
    if (passwordResetMutation.isError) passwordResetMutation.reset();
  }

  const title = passwordResetMutation.isSuccess
    ? "Your password has been updated"
    : resetToken === null
      ? "Open your password reset link"
      : "Create a new password";

  const description = passwordResetMutation.isSuccess
    ? "Your password was changed and every session was signed out. Sign in with your new password to continue."
    : resetToken === null
      ? "This one-time link is missing or may have expired. Request a new link to continue."
      : "Choose a new password for your HealthAlyst staff account.";

  return (
    <StaffAuthLayout
      title={title}
      description={description}
      headingReference={headingReference}
      footer={passwordResetMutation.isSuccess ? undefined : <StaffSignInLink />}
    >
      {resetToken === undefined ? (
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Reading your reset link"
          presentation="inline"
        />
      ) : passwordResetMutation.isSuccess ? (
        <Link
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={APPLICATION_ROUTES.signIn}
        >
          Go to sign in
        </Link>
      ) : resetToken === null ? (
        <Link
          className="text-center text-sm font-semibold text-primary underline underline-offset-4"
          href={APPLICATION_ROUTES.forgotPassword}
        >
          Request a new reset link
        </Link>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={handlePasswordReset}
          noValidate
        >
          <TextField
            autoComplete="new-password"
            id="staff-new-password"
            label="New password"
            placeholder={`At least ${STAFF_PASSWORD_LIMITS.minimum} characters`}
            name="newPassword"
            type="password"
            maxLength={STAFF_PASSWORD_LIMITS.maximum}
            required
            disabled={passwordResetMutation.isPending}
            // Live feedback shows over an older error for the same field.
            error={
              passwordFeedback.errors.newPassword ?? fieldErrors.newPassword
            }
            status={passwordFeedback.statuses.newPassword}
            onChange={(changeEvent) => {
              clearPasswordFeedback("newPassword");
              passwordFeedback.handleValueChange(
                "newPassword",
                changeEvent.currentTarget.value
              );
            }}
            onFieldLeave={() => passwordFeedback.handleFieldBlur("newPassword")}
          />
          <TextField
            autoComplete="new-password"
            id="staff-confirm-new-password"
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            maxLength={STAFF_PASSWORD_LIMITS.maximum}
            required
            disabled={passwordResetMutation.isPending}
            error={
              passwordFeedback.errors.confirmPassword ??
              fieldErrors.confirmPassword
            }
            status={passwordFeedback.statuses.confirmPassword}
            onChange={(changeEvent) => {
              clearPasswordFeedback("confirmPassword");
              passwordFeedback.handleValueChange(
                "confirmPassword",
                changeEvent.currentTarget.value
              );
            }}
            onFieldLeave={() =>
              passwordFeedback.handleFieldBlur("confirmPassword")
            }
          />

          {passwordResetMutation.error && (
            <FormMessage
              tone="error"
              details={
                <Link
                  className="text-sm text-primary underline underline-offset-4"
                  href={APPLICATION_ROUTES.forgotPassword}
                >
                  Request another reset link
                </Link>
              }
            >
              {passwordResetMutation.error.message}
            </FormMessage>
          )}

          <ActionButton
            className="w-full"
            size="large"
            type="submit"
            isLoading={passwordResetMutation.isPending}
            loadingText="Updating password"
          >
            Reset password
          </ActionButton>
        </form>
      )}
    </StaffAuthLayout>
  );
}
