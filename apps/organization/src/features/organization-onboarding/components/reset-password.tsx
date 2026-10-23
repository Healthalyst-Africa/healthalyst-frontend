"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { PasswordInput } from "@healthalyst/ui/components/password-input";
import OrganizationSignInLayout from "~/components/ui/organization-sign-in-layout";
import { usePasswordResetMutation } from "~/features/organization-onboarding/hooks/use-platform-authentication";
import { PASSWORD_LIMITS } from "~/features/organization-onboarding/model/password-rules";
import { passwordResetSchema } from "~/features/organization-onboarding/model/password-reset-schema";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import { readOneTimeTokenFromAddress } from "~/shared/security/read-one-time-token-from-address";

export default function ResetPassword() {
  const [resetToken, setResetToken] = useState<string | null | undefined>(
    undefined
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const headingReference = useRef<HTMLHeadingElement>(null);
  const hasReadTokenReference = useRef(false);
  const passwordResetMutation = usePasswordResetMutation();

  useEffect(() => {
    if (hasReadTokenReference.current) return;
    hasReadTokenReference.current = true;
    const token = readOneTimeTokenFromAddress();
    setResetToken(token ? token : null);
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
    const validationResult = parseFormData(
      passwordResetSchema,
      new FormData(formElement)
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formElement, validationResult.errors);
      return;
    }

    setFieldErrors({});
    passwordResetMutation.mutate(
      {
        token: resetToken,
        password: validationResult.data.newPassword,
      },
      { onSuccess: () => setResetToken(null) }
    );
  }

  function clearPasswordFeedback() {
    setFieldErrors({});
    if (passwordResetMutation.isError) passwordResetMutation.reset();
  }

  const heading = passwordResetMutation.isSuccess
    ? "Your password has been updated"
    : resetToken === null
      ? "Open your password reset link"
      : "Create a new password";

  const introduction = passwordResetMutation.isSuccess
    ? "Your password was changed. Sign in with your new password to continue."
    : resetToken === null
      ? "This one-time link is missing or may have expired. Request a new link to continue."
      : "Choose a new password for your HealthAlyst administrator account.";

  const footerContent = passwordResetMutation.isSuccess ? undefined : (
    <p className="text-sm text-muted-foreground">
      Remember your password?{" "}
      <Link
        className="font-semibold text-primary underline underline-offset-4"
        href="/sign-in"
      >
        Sign in
      </Link>
    </p>
  );

  return (
    <OrganizationSignInLayout
      pageTitle={heading}
      showcaseLabel="About password recovery"
      showcaseLede="Recover access to your organisation account."
      footerContent={footerContent}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2
            ref={headingReference}
            className="font-serif text-3xl font-normal leading-tight outline-none"
            tabIndex={-1}
          >
            {heading}
          </h2>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            {introduction}
          </p>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-5 px-6 py-7 md:px-8 md:py-8">
            {resetToken === undefined ? (
              <p className="text-sm text-muted-foreground" role="status">
                Reading your reset link…
              </p>
            ) : passwordResetMutation.isSuccess ? (
              <Link
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href="/sign-in"
              >
                Go to sign in
              </Link>
            ) : resetToken === null ? (
              <Link
                className="text-center text-sm text-primary underline underline-offset-4"
                href="/forgot-password"
              >
                Request a new reset link
              </Link>
            ) : (
              <form
                className="flex flex-col gap-5"
                onSubmit={handlePasswordReset}
                noValidate
              >
                <FieldGroup className="gap-5">
                  <Field
                    className="gap-1.5"
                    data-invalid={Boolean(fieldErrors.newPassword)}
                    data-disabled={passwordResetMutation.isPending || undefined}
                  >
                    <FieldLabel htmlFor="new-password">New password</FieldLabel>
                    <PasswordInput
                      autoComplete="new-password"
                      id="new-password"
                      name="newPassword"
                      maxLength={PASSWORD_LIMITS.maximum}
                      required
                      visibilityLabel="New password"
                      disabled={passwordResetMutation.isPending}
                      aria-invalid={
                        Boolean(fieldErrors.newPassword) || undefined
                      }
                      aria-describedby={
                        fieldErrors.newPassword
                          ? "new-password-error"
                          : undefined
                      }
                      onChange={clearPasswordFeedback}
                    />
                    {fieldErrors.newPassword && (
                      <FieldError id="new-password-error">
                        {fieldErrors.newPassword}
                      </FieldError>
                    )}
                  </Field>

                  <Field
                    className="gap-1.5"
                    data-invalid={Boolean(fieldErrors.confirmPassword)}
                    data-disabled={passwordResetMutation.isPending || undefined}
                  >
                    <FieldLabel htmlFor="confirm-new-password">
                      Confirm new password
                    </FieldLabel>
                    <PasswordInput
                      autoComplete="new-password"
                      id="confirm-new-password"
                      name="confirmPassword"
                      maxLength={PASSWORD_LIMITS.maximum}
                      required
                      visibilityLabel="Confirm new password"
                      disabled={passwordResetMutation.isPending}
                      aria-invalid={
                        Boolean(fieldErrors.confirmPassword) || undefined
                      }
                      aria-describedby={
                        fieldErrors.confirmPassword
                          ? "confirm-new-password-error"
                          : undefined
                      }
                      onChange={clearPasswordFeedback}
                    />
                    {fieldErrors.confirmPassword && (
                      <FieldError id="confirm-new-password-error">
                        {fieldErrors.confirmPassword}
                      </FieldError>
                    )}
                  </Field>
                </FieldGroup>

                {passwordResetMutation.error && (
                  <div className="flex flex-col gap-2" role="alert">
                    <FieldError>
                      {passwordResetMutation.error.message}
                    </FieldError>
                    <Link
                      className="text-sm text-primary underline underline-offset-4"
                      href="/forgot-password"
                    >
                      Request another reset link
                    </Link>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Use at least {PASSWORD_LIMITS.minimum} characters.
                </p>

                <ActionButton
                  className="w-full"
                  size="large"
                  type="submit"
                  variant="default"
                  isLoading={passwordResetMutation.isPending}
                  loadingText="Updating password"
                >
                  Reset password
                </ActionButton>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizationSignInLayout>
  );
}
