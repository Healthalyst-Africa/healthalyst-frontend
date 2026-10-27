"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { TextField } from "@healthalyst/ui/components/text-field";
import OrganizationSignInLayout from "~/components/ui/organization-sign-in-layout";
import { usePasswordResetMutation } from "~/features/authentication/hooks/use-platform-authentication";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";
import { passwordResetSchema } from "~/features/authentication/schemas/password-reset-schema";
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
        href={ORGANIZATION_ROUTES.signIn}
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
            className="font-serif text-title font-normal outline-none"
            tabIndex={-1}
          >
            {heading}
          </h2>
          <p className="max-w-sm text-lede text-muted-foreground">
            {introduction}
          </p>
        </div>

        <ContentPanel frame="wide-screens">
          {resetToken === undefined ? (
            <BrandLoader
              markSource={BRAND_MARK_SOURCE}
              label="Reading your reset link"
              presentation="inline"
            />
          ) : passwordResetMutation.isSuccess ? (
            <Link
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={ORGANIZATION_ROUTES.signIn}
            >
              Go to sign in
            </Link>
          ) : resetToken === null ? (
            <Link
              className="text-center text-sm text-primary underline underline-offset-4"
              href={ORGANIZATION_ROUTES.forgotPassword}
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
                id="new-password"
                label="New password"
                name="newPassword"
                type="password"
                maxLength={PASSWORD_LIMITS.maximum}
                required
                disabled={passwordResetMutation.isPending}
                error={fieldErrors.newPassword}
                onChange={clearPasswordFeedback}
              />
              <TextField
                autoComplete="new-password"
                id="confirm-new-password"
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                maxLength={PASSWORD_LIMITS.maximum}
                required
                disabled={passwordResetMutation.isPending}
                error={fieldErrors.confirmPassword}
                onChange={clearPasswordFeedback}
              />

              {passwordResetMutation.error && (
                <FormMessage
                  tone="error"
                  details={
                    <Link
                      className="text-sm text-primary underline underline-offset-4"
                      href={ORGANIZATION_ROUTES.forgotPassword}
                    >
                      Request another reset link
                    </Link>
                  }
                >
                  {passwordResetMutation.error.message}
                </FormMessage>
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
        </ContentPanel>
      </div>
    </OrganizationSignInLayout>
  );
}
