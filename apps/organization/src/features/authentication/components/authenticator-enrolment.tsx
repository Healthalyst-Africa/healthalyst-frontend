"use client";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { WorkflowHeading } from "@healthalyst/ui/components/workflow-heading";
import {
  CODE_LENGTH,
  TOTAL_STEPS,
  SET_UP_STEPS,
} from "~/features/authentication/config/authenticator-enrolment";
import { useAuthenticatorConfirmation } from "~/features/authentication/hooks/use-authenticator-confirmation";
import { useRecoveryCodeExport } from "~/features/authentication/hooks/use-recovery-code-export";
import { useAuthenticatorEnrolmentWorkflow } from "~/features/authentication/hooks/use-authenticator-enrolment-workflow";
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
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import type {
  AuthenticatorConfirmation,
  AuthenticatorSetup,
} from "@healthalyst/platform-api/authentication-service";
import type { useAuthenticatorConfirmationMutation } from "~/features/authentication/hooks/use-authenticator-enrolment";

const PRIMARY_LINK_CLASS_NAME =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

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

function ScanAndConfirm({
  setup,
  confirmationMutation,
}: {
  setup: AuthenticatorSetup;
  confirmationMutation: ReturnType<typeof useAuthenticatorConfirmationMutation>;
}) {
  const {
    code,
    codeError,
    keyCopyStatus,
    codeInputReference,
    setupKeyGroups,
    confirmCode,
    handleSubmit,
    copySetupKey,
    handleCodeChange,
  } = useAuthenticatorConfirmation(setup, confirmationMutation);

  return (
    <div className="flex flex-col gap-6">
      <WorkflowHeading
        heading="Protect your account"
        introduction="Add HealthAlyst to an authenticator app on your phone. You will enter a code from it each time you sign in."
        stepNumber={1}
        totalSteps={TOTAL_STEPS}
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
                    onClick={copySetupKey}
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
                onChange={handleCodeChange}
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
  const {
    hasSavedCodes,
    setHasSavedCodes,
    saveStatus,
    downloadRecoveryCodes,
    copyRecoveryCodes,
  } = useRecoveryCodeExport(recoveryCodes);

  return (
    <div className="flex flex-col gap-6">
      <WorkflowHeading
        heading="Save your recovery codes"
        introduction="Use one of these to sign in if you lose your phone or cannot open your authenticator app."
        stepNumber={2}
        totalSteps={TOTAL_STEPS}
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
              onClick={copyRecoveryCodes}
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
  const { setup, setupMutation, confirmationMutation, isExpired } =
    useAuthenticatorEnrolmentWorkflow();

  if (confirmationMutation.data) {
    const confirmation = confirmationMutation.data;
    return (
      <RecoveryCodes
        recoveryCodes={confirmation.recoveryCodes}
        onContinue={() => onEnrolled(confirmation)}
      />
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col gap-6">
        <WorkflowHeading
          heading="Set-up timed out"
          introduction="Setting up the authenticator app took too long, or it is already set up."
        />
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-4 px-6 py-7 md:px-8 md:py-8">
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in with your email address and password. If the account still
              needs an authenticator app, you can set it up straight after.
            </p>
            <Link
              className={PRIMARY_LINK_CLASS_NAME}
              href={ORGANIZATION_ROUTES.signIn}
            >
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
      <WorkflowHeading
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
