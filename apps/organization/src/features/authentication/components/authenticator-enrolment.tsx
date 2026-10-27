"use client";
import { useState } from "react";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { WorkflowHeading } from "@healthalyst/ui/components/workflow-heading";
import {
  CODE_LENGTH,
  RECOVERY_CODES_FILE_HEADING,
  RECOVERY_CODES_FILE_NAME,
  TOTAL_STEPS,
  SET_UP_STEPS,
} from "~/features/authentication/config/authenticator-enrolment";
import { useAuthenticatorConfirmation } from "~/features/authentication/hooks/use-authenticator-confirmation";
import { RecoveryCodesPanel } from "@healthalyst/ui/components/recovery-codes-panel";
import { useAuthenticatorEnrolmentWorkflow } from "~/features/authentication/hooks/use-authenticator-enrolment-workflow";
import { CopyIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { ExpandableSection } from "@healthalyst/ui/components/expandable-section";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { OneTimeCodeField } from "@healthalyst/ui/components/one-time-code-field";
import { QrCode } from "@healthalyst/ui/components/qr-code";
import type {
  AuthenticatorConfirmation,
  AuthenticatorSetup,
} from "@healthalyst/platform-api/authentication-service";
import type { useAuthenticatorConfirmationMutation } from "~/features/authentication/hooks/use-authenticator-enrolment";

const PRIMARY_LINK_CLASS_NAME =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

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
      <ContentPanel className="overflow-hidden" spacing="flush">
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
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary"
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

        <ExpandableSection
          title="Cannot scan the code?"
          className="border-t border-border px-6 md:px-8"
        >
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
        </ExpandableSection>

        <form
          className="flex flex-col gap-5 border-t border-border bg-secondary/50 px-6 py-7 md:px-8 md:py-8"
          onSubmit={handleSubmit}
          noValidate
        >
          <OneTimeCodeField
            ref={codeInputReference}
            id="authenticator-enrolment-code"
            label="Code from your authenticator app"
            name="code"
            length={CODE_LENGTH}
            value={code}
            disabled={confirmationMutation.isPending}
            error={codeError ?? undefined}
            onChange={handleCodeChange}
            onComplete={confirmCode}
          />
          {confirmationMutation.error && (
            <FormMessage tone="error" align="center">
              {confirmationMutation.error.message}
            </FormMessage>
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
      </ContentPanel>
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

  return (
    <div className="flex flex-col gap-6">
      <WorkflowHeading
        heading="Save your recovery codes"
        introduction="Use one of these to sign in if you lose your phone or cannot open your authenticator app."
        stepNumber={2}
        totalSteps={TOTAL_STEPS}
      />
      <ContentPanel>
        <RecoveryCodesPanel
          recoveryCodes={recoveryCodes}
          downloadFileName={RECOVERY_CODES_FILE_NAME}
          downloadHeading={RECOVERY_CODES_FILE_HEADING}
          confirmationIdentifier="recovery-codes-saved"
          hasSavedCodes={hasSavedCodes}
          onHasSavedCodesChange={setHasSavedCodes}
          continueLabel="Continue to HealthAlyst"
          onContinue={onContinue}
        />
      </ContentPanel>
    </div>
  );
}

/**
 * Sets up an authenticator app for an account that has none, using the
 * short-lived enrolment token returned by email confirmation or
 * the password step:
 * `POST /v1/auth/mfa/totp/setup`, then `POST /v1/auth/mfa/totp/confirm` with
 * the first code. The recovery codes are shown once, before `onEnrolled`.
 */
export default function AuthenticatorEnrolment({
  enrolmentToken,
  onEnrolled,
}: {
  enrolmentToken: string;
  onEnrolled: (confirmation: AuthenticatorConfirmation) => void;
}) {
  const { setup, setupMutation, confirmationMutation, isExpired } =
    useAuthenticatorEnrolmentWorkflow(enrolmentToken);

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
        <ContentPanel contentClassName="gap-4">
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
        </ContentPanel>
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
      <ContentPanel contentClassName="gap-4">
        {setupMutation.error ? (
          <>
            <FormMessage tone="error">
              {setupMutation.error.message}
            </FormMessage>
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => setupMutation.mutate()}
            >
              Try again
            </ActionButton>
          </>
        ) : (
          <BrandLoader
            markSource={BRAND_MARK_SOURCE}
            label="Preparing your set-up"
            presentation="inline"
          />
        )}
      </ContentPanel>
    </div>
  );
}
