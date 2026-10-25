"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { EmailSentIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { TextField } from "@healthalyst/ui/components/text-field";
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
      <TextField
        autoComplete="email"
        id="verification-email-address"
        label="Work email address"
        name="emailAddress"
        type="email"
        error={fieldErrors.emailAddress}
        onChange={() => setFieldErrors({})}
      />
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
        <FormMessage tone="error">{resendMutation.error.message}</FormMessage>
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
      router.replace(ORGANIZATION_ROUTES.onboarding);
    }
  }, [platformSession, router]);

  if (platformSession) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Opening your organisation application"
        presentation="inline"
      />
    );
  }

  const enrolmentToken = verificationMutation.data?.enrolmentToken;
  if (enrolmentToken && !hasFinishedEnrolment) {
    return (
      <AuthenticatorEnrolment
        enrolmentToken={enrolmentToken}
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

      <ContentPanel>
        {verificationToken === undefined ? (
          <FormMessage tone="status">
            Reading your confirmation link…
          </FormMessage>
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
              <FormMessage tone="error">
                {verificationError.message}
              </FormMessage>
            )}
          </>
        )}
      </ContentPanel>
    </div>
  );
}
