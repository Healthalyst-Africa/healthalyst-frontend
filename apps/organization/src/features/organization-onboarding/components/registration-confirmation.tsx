"use client";

import { useEffect, useRef, useState } from "react";
import { EmailSentIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import { FieldError } from "@healthalyst/ui/components/field";
import { Separator } from "@healthalyst/ui/components/separator";
import { PlatformApiError } from "~/features/organization-onboarding/api/platform-api-error";
import { useEmailVerificationResendMutation } from "~/features/organization-onboarding/hooks/use-organization-registration";

/** Seconds before another confirmation email can be requested. */
const RESEND_WAIT_IN_SECONDS = 60;

const NEXT_STEPS = [
  {
    title: "Confirm your email address",
    description: "Open the link in the email. It can be used once.",
  },
  {
    title: "Set up an authenticator app",
    description:
      "The administrator account is protected with a code from an authenticator app.",
  },
  {
    title: "HealthAlyst reviews your application",
    description: "Access opens once your organisation is approved.",
  },
] as const;

/**
 * Shown after `POST /v1/onboarding/registrations` succeeds. The API never
 * says whether the address already had an account, so neither does this
 * screen: it explains what happens next and offers to resend the link.
 */
export default function RegistrationConfirmation({
  emailAddress,
}: {
  emailAddress: string;
}) {
  const headingReference = useRef<HTMLHeadingElement>(null);
  const [secondsUntilResend, setSecondsUntilResend] = useState(0);
  const resendMutation = useEmailVerificationResendMutation();
  const resendError = resendMutation.error;

  useEffect(() => {
    headingReference.current?.focus();
  }, []);

  useEffect(() => {
    if (secondsUntilResend <= 0) return;
    const timer = window.setTimeout(
      () => setSecondsUntilResend((seconds) => seconds - 1),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [secondsUntilResend]);

  function requestNewLink() {
    resendMutation.mutate(emailAddress, {
      onSuccess: () => setSecondsUntilResend(RESEND_WAIT_IN_SECONDS),
    });
  }

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
          Check your email
        </h2>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          If{" "}
          <span className="break-all font-medium text-foreground">
            {emailAddress}
          </span>{" "}
          can be used for a new account, we have sent it a confirmation link.
        </p>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-6 px-6 py-7 md:px-8 md:py-8">
          <section aria-labelledby="registration-next-steps-heading">
            <h3
              id="registration-next-steps-heading"
              className="text-sm font-semibold"
            >
              What happens next
            </h3>
            <ol className="mt-4 flex flex-col gap-4">
              {NEXT_STEPS.map((step, stepIndex) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary"
                  >
                    {stepIndex + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <Separator />

          <section
            aria-labelledby="registration-resend-heading"
            className="flex flex-col gap-3"
          >
            <h3 id="registration-resend-heading" className="sr-only">
              Resend the confirmation email
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              No email after a few minutes? Check your spam folder, or request a
              new link.
            </p>
            <ActionButton
              className="w-full"
              size="large"
              type="button"
              variant="outline"
              disabled={secondsUntilResend > 0}
              isLoading={resendMutation.isPending}
              loadingText="Requesting a new link"
              onClick={requestNewLink}
            >
              {secondsUntilResend > 0
                ? `Request again in ${secondsUntilResend} seconds`
                : "Resend confirmation email"}
            </ActionButton>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {resendMutation.isSuccess
                ? "If an unconfirmed account uses that address, a new link is on its way."
                : ""}
            </p>
            {resendError && (
              <div role="alert" className="flex flex-col gap-1">
                <FieldError>{resendError.message}</FieldError>
                {resendError instanceof PlatformApiError &&
                  resendError.requestId && (
                    <p className="text-xs text-muted-foreground">
                      Reference for HealthAlyst support:{" "}
                      <span className="font-mono">{resendError.requestId}</span>
                    </p>
                  )}
              </div>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
