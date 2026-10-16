"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import { emailVerificationRequestSchema } from "~/features/organization-onboarding/model/email-verification-schema";
import {
  useConfirmEmailAddressMutation,
  useResendEmailVerificationMutation,
} from "~/features/organization-onboarding/hooks/use-email-verification";

export default function EmailVerificationPage() {
  const [token, setToken] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const confirmationMutation = useConfirmEmailAddressMutation();
  const resendMutation = useResendEmailVerificationMutation();

  useEffect(() => {
    const verificationToken = new URLSearchParams(
      window.location.hash.slice(1)
    ).get("token");
    if (verificationToken) {
      setToken(verificationToken);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  function handleResendRequest(formEvent: FormEvent<HTMLFormElement>) {
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
    resendMutation.mutate(validationResult.data.emailAddress);
  }

  const confirmationSucceeded = confirmationMutation.isSuccess;
  const confirmationError = confirmationMutation.error?.message;

  return (
    <main className="flex min-h-screen flex-col px-5 py-6 md:px-10">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <HealthAlystBrand />
        <Link
          className="text-sm font-semibold text-primary underline underline-offset-4"
          href="/sign-in"
        >
          Sign in
        </Link>
      </header>
      <div className="mx-auto flex w-full flex-1 items-center justify-center py-10">
        <Card className="w-full max-w-xl border-border bg-card shadow-sm">
          <CardHeader className="gap-2 px-7 pt-8 md:px-10 md:pt-10">
            <CardTitle className="font-serif text-2xl">
              {confirmationSucceeded
                ? "Email confirmed"
                : "Confirm your work email"}
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              {confirmationSucceeded
                ? "Your administrator account is ready. You can now sign in to follow the organisation application."
                : "Confirm the email address used to create your administrator account. The link can only be used once."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 px-7 pb-8 md:px-10 md:pb-10">
            {confirmationSucceeded ? (
              <Link
                className="text-sm font-semibold text-primary underline underline-offset-4"
                href="/sign-in"
              >
                Continue to sign in
              </Link>
            ) : token ? (
              <>
                <ActionButton
                  className="w-full"
                  size="large"
                  type="button"
                  isLoading={confirmationMutation.isPending}
                  loadingText="Confirming email"
                  onClick={() => confirmationMutation.mutate(token)}
                >
                  Confirm email address
                </ActionButton>
                {confirmationError && (
                  <div className="flex flex-col gap-4">
                    <FieldError>{confirmationError}</FieldError>
                    <p className="text-sm text-muted-foreground">
                      Request a fresh link if this one has expired or was
                      already used.
                    </p>
                    <form
                      className="flex flex-col gap-4"
                      onSubmit={handleResendRequest}
                      noValidate
                    >
                      <Field data-invalid={Boolean(fieldErrors.emailAddress)}>
                        <FieldLabel htmlFor="verification-email-address">
                          Work email address
                        </FieldLabel>
                        <Input
                          autoComplete="email"
                          id="verification-email-address"
                          name="emailAddress"
                          type="email"
                          aria-invalid={
                            Boolean(fieldErrors.emailAddress) || undefined
                          }
                          aria-describedby={
                            fieldErrors.emailAddress
                              ? "verification-email-address-error"
                              : undefined
                          }
                        />
                        {fieldErrors.emailAddress && (
                          <FieldError id="verification-email-address-error">
                            {fieldErrors.emailAddress}
                          </FieldError>
                        )}
                      </Field>
                      <ActionButton
                        type="submit"
                        variant="outline"
                        isLoading={resendMutation.isPending}
                        loadingText="Requesting a new link"
                      >
                        Send a new confirmation link
                      </ActionButton>
                      {resendMutation.isSuccess && (
                        <p
                          className="text-sm text-muted-foreground"
                          role="status"
                        >
                          If an unconfirmed account uses that address, a new
                          link will be sent shortly.
                        </p>
                      )}
                      {resendMutation.error && (
                        <FieldError>{resendMutation.error.message}</FieldError>
                      )}
                    </form>
                  </div>
                )}
              </>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={handleResendRequest}
                noValidate
              >
                <Field data-invalid={Boolean(fieldErrors.emailAddress)}>
                  <FieldLabel htmlFor="verification-email-address">
                    Work email address
                  </FieldLabel>
                  <Input
                    autoComplete="email"
                    id="verification-email-address"
                    name="emailAddress"
                    type="email"
                    aria-invalid={
                      Boolean(fieldErrors.emailAddress) || undefined
                    }
                    aria-describedby={
                      fieldErrors.emailAddress
                        ? "verification-email-address-error"
                        : undefined
                    }
                  />
                  {fieldErrors.emailAddress && (
                    <FieldError id="verification-email-address-error">
                      {fieldErrors.emailAddress}
                    </FieldError>
                  )}
                </Field>
                <ActionButton
                  type="submit"
                  variant="outline"
                  isLoading={resendMutation.isPending}
                  loadingText="Requesting a new link"
                >
                  Send a new confirmation link
                </ActionButton>
                {resendMutation.isSuccess && (
                  <p className="text-sm text-muted-foreground" role="status">
                    If an unconfirmed account uses that address, a link will be
                    sent shortly.
                  </p>
                )}
                {resendMutation.error && (
                  <FieldError>{resendMutation.error.message}</FieldError>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
