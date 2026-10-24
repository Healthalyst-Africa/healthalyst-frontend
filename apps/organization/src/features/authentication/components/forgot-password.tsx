"use client";

import { ORGANIZATION_ROUTES } from "~/config/routes";

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
import { Input } from "@healthalyst/ui/components/input";
import OrganizationSignInLayout from "~/components/ui/organization-sign-in-layout";
import { usePasswordResetRequestMutation } from "~/features/authentication/hooks/use-platform-authentication";
import { emailVerificationRequestSchema } from "~/features/authentication/schemas/email-verification-schema";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

export default function ForgotPassword() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const headingReference = useRef<HTMLHeadingElement>(null);
  const passwordResetMutation = usePasswordResetRequestMutation();

  useEffect(() => {
    if (passwordResetMutation.isSuccess) {
      headingReference.current?.focus();
    }
  }, [passwordResetMutation.isSuccess]);

  function handlePasswordResetRequest(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const validationResult = parseFormData(
      emailVerificationRequestSchema,
      new FormData(formElement)
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formElement, validationResult.errors);
      return;
    }

    setFieldErrors({});
    passwordResetMutation.mutate(validationResult.data.emailAddress);
  }

  function clearEmailFeedback() {
    setFieldErrors({});
    if (passwordResetMutation.isError || passwordResetMutation.isSuccess) {
      passwordResetMutation.reset();
    }
  }

  return (
    <OrganizationSignInLayout
      pageTitle="Reset your password"
      showcaseLabel="About password recovery"
      showcaseLede="Recover access to your organisation account."
      footerContent={
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            className="font-semibold text-primary underline underline-offset-4"
            href={ORGANIZATION_ROUTES.signIn}
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2
            ref={headingReference}
            className="font-serif text-3xl font-normal leading-tight outline-none"
            tabIndex={-1}
          >
            Forgot your password?
          </h2>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Enter your administrator email address and we’ll send instructions
            if it matches an account.
          </p>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-5 px-6 py-7 md:px-8 md:py-8">
            <form
              className="flex flex-col gap-5"
              onSubmit={handlePasswordResetRequest}
              noValidate
            >
              <FieldGroup>
                <Field
                  className="gap-1.5"
                  data-invalid={Boolean(fieldErrors.emailAddress)}
                  data-disabled={passwordResetMutation.isPending || undefined}
                >
                  <FieldLabel htmlFor="password-reset-email-address">
                    Work email address
                  </FieldLabel>
                  <Input
                    autoComplete="email"
                    id="password-reset-email-address"
                    name="emailAddress"
                    type="email"
                    maxLength={254}
                    required
                    disabled={passwordResetMutation.isPending}
                    aria-invalid={
                      Boolean(fieldErrors.emailAddress) || undefined
                    }
                    aria-describedby={
                      fieldErrors.emailAddress
                        ? "password-reset-email-address-error"
                        : undefined
                    }
                    onChange={clearEmailFeedback}
                  />
                  {fieldErrors.emailAddress && (
                    <FieldError id="password-reset-email-address-error">
                      {fieldErrors.emailAddress}
                    </FieldError>
                  )}
                </Field>
              </FieldGroup>

              {passwordResetMutation.isSuccess && (
                <p
                  className="text-sm leading-6 text-muted-foreground"
                  role="status"
                >
                  If an account matches that email address, password reset
                  instructions are on their way. Check your inbox and spam
                  folder.
                </p>
              )}

              {passwordResetMutation.error && (
                <FieldError role="alert">
                  {passwordResetMutation.error.message}
                </FieldError>
              )}

              <ActionButton
                className="w-full"
                size="large"
                type="submit"
                variant="default"
                isLoading={passwordResetMutation.isPending}
                loadingText="Sending instructions"
              >
                Send password reset instructions
              </ActionButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </OrganizationSignInLayout>
  );
}
