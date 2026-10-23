"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CopyIcon, DownloadIcon, InformationIcon } from "@healthalyst/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@healthalyst/ui/components/accordion";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@healthalyst/ui/components/alert";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import { Checkbox } from "@healthalyst/ui/components/checkbox";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@healthalyst/ui/components/input-otp";
import { QrCode } from "@healthalyst/ui/components/qr-code";
import { cn } from "@healthalyst/ui/lib/utilities";
import { PlatformApiError } from "~/features/organization-onboarding/api/platform-api-error";
import type {
  AuthenticatorConfirmation,
  AuthenticatorSetup,
} from "~/features/organization-onboarding/api/platform-authentication-service";
import {
  useAuthenticatorConfirmationMutation,
  useAuthenticatorSetupMutation,
} from "~/features/organization-onboarding/hooks/use-authenticator-enrolment";
import { authenticatorCodeSchema } from "~/features/organization-onboarding/model/sign-in-schema";

const CODE_LENGTH = 6;
const TOTAL_STEPS = 2;
const RECOVERY_CODES_FILE_NAME = "healthalyst-recovery-codes.txt";

const PRIMARY_LINK_CLASS_NAME =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Codes that mean the enrolment token can no longer be used. */
const EXPIRED_ENROLMENT_CODES = new Set([
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_INVALID",
  "AUTH_TOKEN_MISSING",
  "MFA_ALREADY_CONFIRMED",
]);

function isExpiredEnrolment(error: Error | null): boolean {
  return (
    error instanceof PlatformApiError &&
    error.code !== null &&
    EXPIRED_ENROLMENT_CODES.has(error.code)
  );
}

/** The key in groups of four, easier to read and type into an app. */
function groupSetupKey(setupKey: string): string[] {
  return setupKey.match(/.{1,4}/g) ?? [setupKey];
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function StageHeading({
  heading,
  introduction,
  stepNumber,
}: {
  heading: string;
  introduction: string;
  stepNumber?: number;
}) {
  const headingReference = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingReference.current?.focus();
  }, [heading]);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h2
        ref={headingReference}
        className="font-serif text-3xl font-normal leading-tight outline-none"
        tabIndex={-1}
      >
        {stepNumber !== undefined && (
          <span className="sr-only">{`Step ${stepNumber} of ${TOTAL_STEPS}: `}</span>
        )}
        {heading}
      </h2>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        {introduction}
      </p>
    </div>
  );
}

function ApiErrorMessage({
  error,
  className,
}: {
  error: Error;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col gap-1", className)}>
      <FieldError>{error.message}</FieldError>
      {error instanceof PlatformApiError && error.requestId && (
        <p className="text-xs text-muted-foreground">
          Reference for HealthAlyst support:{" "}
          <span className="font-mono">{error.requestId}</span>
        </p>
      )}
    </div>
  );
}

const SET_UP_STEPS = [
  {
    title: "Get an authenticator app",
    description:
      "Google Authenticator, Microsoft Authenticator or any app that shows 6-digit codes.",
  },
  {
    title: "Add HealthAlyst to the app",
    description:
      "Scan the QR code with the app, or use the setup key if you cannot scan it.",
  },
  {
    title: "Enter the code it shows",
    description: "The code changes every 30 seconds.",
  },
] as const;

function ScanAndConfirm({
  setup,
  confirmationMutation,
}: {
  setup: AuthenticatorSetup;
  confirmationMutation: ReturnType<typeof useAuthenticatorConfirmationMutation>;
}) {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [keyCopyStatus, setKeyCopyStatus] = useState("");
  const codeInputReference = useRef<HTMLInputElement>(null);
  const setupKeyGroups = groupSetupKey(setup.secret);

  function confirmCode(enteredCode: string) {
    const validationResult = authenticatorCodeSchema.safeParse({
      code: enteredCode,
    });
    if (!validationResult.success) {
      setCodeError(
        validationResult.error.issues[0]?.message ??
          "Enter the 6-digit code from your authenticator app."
      );
      codeInputReference.current?.focus();
      return;
    }
    setCodeError(null);
    confirmationMutation.mutate(
      {
        factorId: setup.factorId,
        code: validationResult.data.code,
      },
      {
        onError: () => {
          // A wrong code is retyped from the start. The input is still
          // disabled while the request settles, so focus after it re-renders.
          setCode("");
          window.requestAnimationFrame(() =>
            codeInputReference.current?.focus()
          );
        },
      }
    );
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    confirmCode(code);
  }

  return (
    <div className="flex flex-col gap-6">
      <StageHeading
        heading="Protect your account"
        introduction="Add HealthAlyst to an authenticator app on your phone. You will enter a code from it each time you sign in."
        stepNumber={1}
      />
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardContent className="flex flex-col p-0">
          <div className="grid gap-6 px-6 py-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start md:px-8 md:py-8">
            <div className="flex flex-col items-center gap-3">
              <QrCode
                value={setup.otpauthUrl}
                size={148}
                label="QR code for adding HealthAlyst to your authenticator app"
              />
              <a
                className={`${PRIMARY_LINK_CLASS_NAME} sm:hidden`}
                href={setup.otpauthUrl}
              >
                Open in your authenticator app
              </a>
            </div>
            <ol className="flex flex-col gap-4">
              {SET_UP_STEPS.map((step, stepIndex) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gold-light bg-gold-subtle text-xs font-semibold text-ink-soft"
                  >
                    {stepIndex + 1}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-medium">{step.title}</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Accordion
            type="single"
            collapsible
            className="border-t border-border px-6 md:px-8"
          >
            <AccordionItem value="setup-key" className="border-b-0">
              <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline">
                Cannot scan the code?
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  Choose to enter a setup key in your app, name the account
                  HealthAlyst, and type this key:
                </p>
                <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-4 py-3">
                  <p
                    aria-label={`Setup key: ${setup.secret.split("").join(" ")}`}
                    className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium tabular-nums tracking-[0.12em] text-foreground"
                  >
                    {setupKeyGroups.map((group, groupIndex) => (
                      <span key={`${group}-${groupIndex}`}>{group}</span>
                    ))}
                  </p>
                  <ActionButton
                    className="shrink-0"
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Copy setup key"
                    onClick={async () =>
                      setKeyCopyStatus(
                        (await copyText(setup.secret))
                          ? "Setup key copied."
                          : "Copying is not available here. Type the setup key in."
                      )
                    }
                  >
                    <CopyIcon aria-hidden="true" className="size-4" />
                  </ActionButton>
                </div>
                <p aria-live="polite" className="sr-only">
                  {keyCopyStatus}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <form
            className="flex flex-col gap-5 border-t border-border bg-gold-subtle px-6 py-7 md:px-8 md:py-8"
            onSubmit={handleSubmit}
            noValidate
          >
            <Field
              className="items-center gap-3"
              data-invalid={Boolean(codeError)}
            >
              <FieldLabel
                className="justify-center"
                htmlFor="authenticator-enrolment-code"
              >
                Code from your authenticator app
              </FieldLabel>
              <InputOTP
                ref={codeInputReference}
                id="authenticator-enrolment-code"
                name="code"
                maxLength={CODE_LENGTH}
                inputMode="numeric"
                pattern="^[0-9]*$"
                autoComplete="one-time-code"
                value={code}
                disabled={confirmationMutation.isPending}
                aria-invalid={Boolean(codeError) || undefined}
                aria-describedby={
                  codeError ? "authenticator-enrolment-code-error" : undefined
                }
                onChange={(enteredCode) => {
                  setCode(enteredCode);
                  setCodeError(null);
                  if (confirmationMutation.error) {
                    confirmationMutation.reset();
                  }
                }}
                onComplete={confirmCode}
                containerClassName="justify-center gap-3"
              >
                <InputOTPGroup>
                  {[0, 1, 2].map((slotIndex) => (
                    <InputOTPSlot
                      key={slotIndex}
                      index={slotIndex}
                      className="h-12 w-11 bg-card text-lg font-medium tabular-nums"
                    />
                  ))}
                </InputOTPGroup>
                <InputOTPGroup>
                  {[3, 4, 5].map((slotIndex) => (
                    <InputOTPSlot
                      key={slotIndex}
                      index={slotIndex}
                      className="h-12 w-11 bg-card text-lg font-medium tabular-nums"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {codeError && (
                <FieldError
                  id="authenticator-enrolment-code-error"
                  className="text-center"
                >
                  {codeError}
                </FieldError>
              )}
            </Field>
            {confirmationMutation.error && (
              <ApiErrorMessage
                className="items-center text-center"
                error={confirmationMutation.error}
              />
            )}
            <ActionButton
              className="w-full"
              size="large"
              type="submit"
              isLoading={confirmationMutation.isPending}
              loadingText="Checking the code"
            >
              Verify and continue
            </ActionButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RecoveryCodes({
  recoveryCodes,
  onContinue,
}: {
  recoveryCodes: readonly string[];
  onContinue: () => void;
}) {
  const [hasSavedCodes, setHasSavedCodes] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const recoveryCodesText = recoveryCodes.join("\n");

  function downloadRecoveryCodes() {
    const file = new Blob(
      [
        `HealthAlyst recovery codes\nEach code signs in once when your authenticator app is unavailable.\n\n${recoveryCodesText}\n`,
      ],
      { type: "text/plain" }
    );
    const fileAddress = URL.createObjectURL(file);
    const downloadLink = document.createElement("a");
    downloadLink.href = fileAddress;
    downloadLink.download = RECOVERY_CODES_FILE_NAME;
    downloadLink.click();
    URL.revokeObjectURL(fileAddress);
    setSaveStatus(`Downloaded ${RECOVERY_CODES_FILE_NAME}.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <StageHeading
        heading="Save your recovery codes"
        introduction="Use one of these to sign in if you lose your phone or cannot open your authenticator app."
        stepNumber={2}
      />
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-5 px-6 py-7 md:px-8 md:py-8">
          <Alert>
            <InformationIcon aria-hidden="true" className="size-4" />
            <AlertTitle>You will only see these once</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Each code works one time. Keep them somewhere safe and away from
              your phone, such as a password manager.
            </AlertDescription>
          </Alert>
          <ul
            aria-label="Recovery codes"
            className="grid h-48 grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            tabIndex={0}
          >
            {recoveryCodes.map((recoveryCode) => (
              <li
                key={recoveryCode}
                className="rounded-md bg-secondary px-3 py-2.5 text-center text-sm font-medium tabular-nums tracking-[0.08em]"
              >
                {recoveryCode}
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-2">
            <ActionButton
              type="button"
              variant="outline"
              leadingIcon={<DownloadIcon />}
              onClick={downloadRecoveryCodes}
            >
              Download codes
            </ActionButton>
            <ActionButton
              type="button"
              variant="outline"
              leadingIcon={<CopyIcon />}
              onClick={async () =>
                setSaveStatus(
                  (await copyText(recoveryCodesText))
                    ? "Recovery codes copied."
                    : "Copying is not available here. Download the codes instead."
                )
              }
            >
              Copy codes
            </ActionButton>
          </div>
          <p aria-live="polite" className="-mt-2 text-xs text-muted-foreground">
            {saveStatus}
          </p>
          <Field className="gap-1.5 border-t border-border pt-5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="recovery-codes-saved"
                className="mt-0.5"
                checked={hasSavedCodes}
                onCheckedChange={(checked) =>
                  setHasSavedCodes(checked === true)
                }
              />
              <FieldLabel
                htmlFor="recovery-codes-saved"
                className="font-normal leading-5"
              >
                I have saved my recovery codes somewhere safe.
              </FieldLabel>
            </div>
          </Field>
          <ActionButton
            className="w-full"
            size="large"
            type="button"
            disabled={!hasSavedCodes}
            onClick={onContinue}
          >
            Continue to HealthAlyst
          </ActionButton>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Sets up an authenticator app for an account that has none, using the
 * short-lived HttpOnly challenge cookie established by email confirmation or
 * the password step:
 * `POST /v1/auth/mfa/totp/setup`, then `POST /v1/auth/mfa/totp/confirm` with
 * the first code. The recovery codes are shown once, before `onEnrolled`.
 */
export default function AuthenticatorEnrolment({
  onEnrolled,
}: {
  onEnrolled: (confirmation: AuthenticatorConfirmation) => void;
}) {
  const hasStartedSetupReference = useRef(false);
  const setupMutation = useAuthenticatorSetupMutation();
  const confirmationMutation = useAuthenticatorConfirmationMutation();
  const setup = setupMutation.data;

  useEffect(() => {
    // Each setup call creates a new factor, so it must run once: React runs
    // effects twice in development.
    if (hasStartedSetupReference.current) return;
    hasStartedSetupReference.current = true;
    setupMutation.mutate();
  }, [setupMutation]);

  if (confirmationMutation.data) {
    const confirmation = confirmationMutation.data;
    return (
      <RecoveryCodes
        recoveryCodes={confirmation.recoveryCodes}
        onContinue={() => onEnrolled(confirmation)}
      />
    );
  }

  if (
    isExpiredEnrolment(setupMutation.error) ||
    isExpiredEnrolment(confirmationMutation.error)
  ) {
    return (
      <div className="flex flex-col gap-6">
        <StageHeading
          heading="Set-up timed out"
          introduction="Setting up the authenticator app took too long, or it is already set up."
        />
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-4 px-6 py-7 md:px-8 md:py-8">
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in with your email address and password. If the account still
              needs an authenticator app, you can set it up straight after.
            </p>
            <Link className={PRIMARY_LINK_CLASS_NAME} href="/sign-in">
              Go to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (setup) {
    return (
      <ScanAndConfirm
        setup={setup}
        confirmationMutation={confirmationMutation}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StageHeading
        heading="Protect your account"
        introduction="Add HealthAlyst to an authenticator app on your phone. You will enter a code from it each time you sign in."
      />
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-4 px-6 py-7 md:px-8 md:py-8">
          {setupMutation.error ? (
            <>
              <ApiErrorMessage error={setupMutation.error} />
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setupMutation.mutate()}
              >
                Try again
              </ActionButton>
            </>
          ) : (
            <p className="text-sm text-muted-foreground" role="status">
              Preparing your set-up…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
