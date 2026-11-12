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
import { useEmailChangeConfirmationMutation } from "~/features/authentication/hooks/use-platform-authentication";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";
import { passwordResetSchema } from "~/features/authentication/schemas/password-reset-schema";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import { readOneTimeTokenFromAddress } from "~/shared/security/read-one-time-token-from-address";

/**
 * Opened from the link sent to a new sign-in email address. Choosing a new
 * password confirms the address; the authenticator app stays the same.
 */
export default function ConfirmEmailChange() {
  const [confirmationToken, setConfirmationToken] = useState<
    string | null | undefined
  >(undefined);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const headingReference = useRef<HTMLHeadingElement>(null);
  const hasReadTokenReference = useRef(false);
  const confirmationMutation = useEmailChangeConfirmationMutation();

  useEffect(() => {
    if (hasReadTokenReference.current) return;
    hasReadTokenReference.current = true;
    const token = readOneTimeTokenFromAddress();
    setConfirmationToken(token ? token : null);
  }, []);

  useEffect(() => {
    if (confirmationMutation.isSuccess) {
      headingReference.current?.focus();
    }
  }, [confirmationMutation.isSuccess]);

  function handleConfirmation(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!confirmationToken) return;

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
    confirmationMutation.mutate(
      {
        token: confirmationToken,
        password: validationResult.data.newPassword,
      },
      { onSuccess: () => setConfirmationToken(null) }
    );
  }

  function clearPasswordFeedback() {
    setFieldErrors({});
    if (confirmationMutation.isError) confirmationMutation.reset();
  }

  const heading = confirmationMutation.isSuccess
    ? "Your sign-in email has changed"
    : confirmationToken === null
      ? "Open your confirmation link"
      : "Confirm your new email address";

  const introduction = confirmationMutation.isSuccess
    ? "Sign in with your new email address and new password. Your authenticator app still works."
    : confirmationToken === null
      ? "This one-time link is missing or may have expired. Ask your organisation's administrator to send a new one."
      : "Choose a new password to finish. You will sign in with this email address and the authenticator app you already use.";

  const footerContent = confirmationMutation.isSuccess ? undefined : (
    <p className="text-sm text-muted-foreground">
      Already confirmed?{" "}
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
      showcaseLabel="About changing your sign-in email"
      showcaseLede="Get back into your organisation account with a new email address."
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
          {confirmationToken === undefined ? (
            <BrandLoader
              markSource={BRAND_MARK_SOURCE}
              label="Reading your confirmation link"
              presentation="inline"
            />
          ) : confirmationMutation.isSuccess ? (
            <Link
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href={ORGANIZATION_ROUTES.signIn}
            >
              Go to sign in
            </Link>
          ) : confirmationToken === null ? (
            <Link
              className="text-center text-sm text-primary underline underline-offset-4"
              href={ORGANIZATION_ROUTES.signIn}
            >
              Go to sign in
            </Link>
          ) : (
            <form
              className="flex flex-col gap-5"
              onSubmit={handleConfirmation}
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
                disabled={confirmationMutation.isPending}
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
                disabled={confirmationMutation.isPending}
                error={fieldErrors.confirmPassword}
                onChange={clearPasswordFeedback}
              />

              {confirmationMutation.error && (
                <FormMessage
                  tone="error"
                  details={
                    <p className="text-sm text-muted-foreground">
                      If the link has expired, ask your organisation&apos;s
                      administrator to send a new one.
                    </p>
                  }
                >
                  {confirmationMutation.error.message}
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
                isLoading={confirmationMutation.isPending}
                loadingText="Confirming email address"
              >
                Confirm and set password
              </ActionButton>
            </form>
          )}
        </ContentPanel>
      </div>
    </OrganizationSignInLayout>
  );
}
