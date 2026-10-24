"use client";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { EmailSentIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import AuthenticatorEnrolment from "~/features/authentication/components/authenticator-enrolment";
import {
  useEmailVerificationMutation,
  useEmailVerificationResendMutation,
} from "~/features/authentication/hooks/use-email-verification";
import { emailVerificationRequestSchema } from "~/features/authentication/schemas/email-verification-schema";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import { readOneTimeTokenFromAddress } from "~/shared/security/read-one-time-token-from-address";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";

function ResendConfirmationForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const resendMutation = useEmailVerificationResendMutation();

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

  return (
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
          aria-invalid={Boolean(fieldErrors.emailAddress) || undefined}
          aria-describedby={
            fieldErrors.emailAddress
              ? "verification-email-address-error"
              : undefined
          }
          onChange={() => setFieldErrors({})}
        />
        {fieldErrors.emailAddress && (
          <FieldError id="verification-email-address-error">
            {fieldErrors.emailAddress}
          </FieldError>
        )}
      </Field>
      <ActionButton
        className="w-full"
        size="large"
        type="submit"
        variant="outline"
        isLoading={resendMutation.isPending}
        loadingText="Requesting a new link"
      >
        Send a new confirmation link
      </ActionButton>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {resendMutation.isSuccess
          ? "If an unconfirmed account uses that address, a new link is on its way."
          : ""}
      </p>
      {resendMutation.error && (
        <FieldError role="alert">{resendMutation.error.message}</FieldError>
      )}
    </form>
  );
}

/**
 * The page the confirmation email links to, for the Platform API. Confirming
 * waits for a click, so a mail scanner that opens the link cannot use it up.
 */
export default function EmailVerification() {
  const [verificationToken, setVerificationToken] = useState<
    string | null | undefined
  >(undefined);
  const headingReference = useRef<HTMLHeadingElement>(null);
  const verificationMutation = useEmailVerificationMutation();
  const router = useRouter();
  const { platformSession, setPlatformSession } = usePlatformSession();
  const [hasFinishedEnrolment, setHasFinishedEnrolment] = useState(false);
  const verificationError = verificationMutation.error;
  const isLinkExpired =
    verificationError instanceof PlatformApiError &&
    verificationError.code === "TOKEN_EXPIRED";

  const hasReadTokenReference = useRef(false);

  useEffect(() => {
    // Reading also removes the token from the address bar, so it must happen
    // once: React runs effects twice in development.
    if (hasReadTokenReference.current) return;
    hasReadTokenReference.current = true;
    setVerificationToken(readOneTimeTokenFromAddress());
  }, []);

  useEffect(() => {
    if (verificationMutation.isSuccess) {
      headingReference.current?.focus();
    }
  }, [verificationMutation.isSuccess]);

  useEffect(() => {
    if (platformSession) {
      router.replace(ORGANIZATION_ROUTES.application);
    }
  }, [platformSession, router]);

  if (platformSession) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Opening your organisation application…
      </p>
    );
  }

  const authenticatorEnrolmentRequired =
    verificationMutation.data?.authenticatorEnrolmentRequired;
  if (authenticatorEnrolmentRequired && !hasFinishedEnrolment) {
    return (
      <AuthenticatorEnrolment
        onEnrolled={(confirmation) => {
          if (confirmation.session) {
            setPlatformSession(confirmation.session);
            return;
          }
          setHasFinishedEnrolment(true);
        }}
      />
    );
  }

  const heading = verificationMutation.isSuccess
    ? "Email address confirmed"
    : isLinkExpired
      ? "This link has expired"
      : verificationToken === null
        ? "Open the link from your email"
        : "Confirm your email address";

  const introduction = verificationMutation.isSuccess
    ? "Your administrator email address is confirmed."
    : isLinkExpired
      ? "Confirmation links work once and for a limited time. Request a new one below."
      : verificationToken === null
        ? "Use the link in the confirmation email we sent to the administrator address. If you cannot find it, request a new one."
        : "Confirm the email address for your HealthAlyst administrator account.";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
          <EmailSentIcon aria-hidden="true" />
        </span>
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
          {verificationToken === undefined ? (
            <p className="text-sm text-muted-foreground" role="status">
              Reading your confirmation link…
            </p>
          ) : verificationMutation.isSuccess ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-6 text-muted-foreground">
                Sign in with your email address and password to continue.
              </p>
              <Link
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={ORGANIZATION_ROUTES.signIn}
              >
                Go to sign in
              </Link>
            </div>
          ) : isLinkExpired || verificationToken === null ? (
            <ResendConfirmationForm />
          ) : (
            <>
              <ActionButton
                className="w-full"
                size="large"
                type="button"
                isLoading={verificationMutation.isPending}
                loadingText="Confirming your email address"
                onClick={() => verificationMutation.mutate(verificationToken)}
              >
                Confirm email address
              </ActionButton>
              {verificationError && (
                <div role="alert" className="flex flex-col gap-1">
                  <FieldError>{verificationError.message}</FieldError>
                  {verificationError instanceof PlatformApiError &&
                    verificationError.requestId && (
                      <p className="text-xs text-muted-foreground">
                        Reference for HealthAlyst support:{" "}
                        <span className="font-mono">
                          {verificationError.requestId}
                        </span>
                      </p>
                    )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
