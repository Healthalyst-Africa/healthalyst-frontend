"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import Link from "next/link";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { OneTimeCodeField } from "@healthalyst/ui/components/one-time-code-field";
import { QrCode } from "@healthalyst/ui/components/qr-code";
import { RecoveryCodesPanel } from "@healthalyst/ui/components/recovery-codes-panel";
import { TextField } from "@healthalyst/ui/components/text-field";
import { useStaffSignInFlow } from "~/features/staff-auth/hooks/use-staff-sign-in-flow";
import {
  STAFF_AUTHENTICATOR_CONFIGURATION,
  STAFF_RECOVERY_CODES_FILE,
} from "~/features/staff-auth/config/staff-sign-in";
import { StaffAuthLayout } from "~/features/staff-auth/components/staff-auth-layout";
import { APPLICATION_ROUTES } from "~/config/application-routes";

export function StaffSignInForm() {
  const {
    stage,
    headingReference,
    status,
    sessionError,
    fieldErrors,
    verificationCode,
    hasSavedRecoveryCodes,
    setVerificationCode,
    setHasSavedRecoveryCodes,
    clearFieldError,
    toggleVerificationMethod,
    authenticatorSetupMutation,
    passwordMutation,
    verificationMutation,
    authenticatorConfirmationMutation,
    handlePasswordSubmit,
    handleVerificationSubmit,
    handleVerificationCodeChange,
    handleEnrollmentSubmit,
    returnToPasswordStep,
    finishAuthenticatorEnrollment,
    stageTitle,
    stageDescription,
  } = useStaffSignInFlow();

  const footerContent =
    stage.kind === "verification" ? (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-muted-foreground">
          <ActionButton
            className="h-auto px-0 text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline"
            size="unstyled"
            type="button"
            variant="link"
            disabled={verificationMutation.isPending}
            onClick={returnToPasswordStep}
          >
            Sign in with a different account
          </ActionButton>
        </p>
      </div>
    ) : undefined;

  // Restoring an existing session after a refresh shows the brand, not the form.
  if (status === "loading") {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Checking your staff session"
      />
    );
  }

  return (
    <StaffAuthLayout
      title={stageTitle}
      description={stageDescription}
      headingReference={headingReference}
      footer={footerContent}
    >
      {stage.kind === "password" && (
        <form
          className="flex flex-col gap-5"
          onSubmit={handlePasswordSubmit}
          noValidate
        >
          <TextField
            id="staff-email-address"
            label="Work email address"
            name="emailAddress"
            type="email"
            autoComplete="username"
            error={fieldErrors.emailAddress}
            onChange={() => clearFieldError("emailAddress")}
          />
          <TextField
            id="staff-password"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            error={fieldErrors.password}
            onChange={() => clearFieldError("password")}
          />
          <p className="-mt-3 self-end text-sm">
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href={APPLICATION_ROUTES.forgotPassword}
            >
              Forgot password?
            </Link>
          </p>
          {passwordMutation.error && (
            <FormMessage tone="error">
              {passwordMutation.error.message}
            </FormMessage>
          )}
          {sessionError && !passwordMutation.error && (
            <FormMessage tone="error">{sessionError}</FormMessage>
          )}
          {authenticatorSetupMutation.error && (
            <FormMessage tone="error">
              {authenticatorSetupMutation.error.message}
            </FormMessage>
          )}
          <ActionButton
            type="submit"
            size="large"
            className="w-full"
            isLoading={
              passwordMutation.isPending || authenticatorSetupMutation.isPending
            }
            loadingText="Signing in"
          >
            Sign in
          </ActionButton>
        </form>
      )}

      {stage.kind === "verification" && (
        <form
          className="flex flex-col gap-5"
          onSubmit={handleVerificationSubmit}
          noValidate
        >
          {stage.method === "totp" ? (
            <OneTimeCodeField
              id="staff-authenticator-code"
              label="Authenticator code"
              length={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
              required
              value={verificationCode}
              disabled={verificationMutation.isPending}
              error={fieldErrors.code || verificationMutation.error?.message}
              onChange={handleVerificationCodeChange}
            />
          ) : (
            <TextField
              id="staff-authenticator-code"
              label="Recovery code"
              autoComplete="one-time-code"
              value={verificationCode}
              maxLength={
                STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength
              }
              required
              disabled={verificationMutation.isPending}
              error={fieldErrors.code || verificationMutation.error?.message}
              onChange={(changeEvent) =>
                handleVerificationCodeChange(changeEvent.target.value)
              }
            />
          )}
          <ActionButton
            type="submit"
            size="large"
            className="w-full"
            isLoading={verificationMutation.isPending}
            loadingText="Checking code"
          >
            Continue
          </ActionButton>
          {stage.methods.length > 1 && (
            <ActionButton
              className="self-center font-normal"
              size="small"
              type="button"
              variant="link"
              disabled={verificationMutation.isPending}
              onClick={toggleVerificationMethod}
            >
              {stage.method === "totp"
                ? "Use a recovery code instead"
                : "Use an authenticator code instead"}
            </ActionButton>
          )}
        </form>
      )}

      {stage.kind === "enrollment-loading" && (
        <div className="flex flex-col items-center gap-4 text-center">
          {!authenticatorSetupMutation.error && (
            <BrandLoader
              markSource={BRAND_MARK_SOURCE}
              label="Preparing authenticator setup"
              presentation="inline"
            />
          )}
          {authenticatorSetupMutation.error && (
            <FormMessage tone="error">
              {authenticatorSetupMutation.error.message}
            </FormMessage>
          )}
          <ActionButton
            type="button"
            isLoading={authenticatorSetupMutation.isPending}
            loadingText="Preparing setup"
            onClick={() =>
              authenticatorSetupMutation.mutate(stage.enrolmentToken)
            }
          >
            Try again
          </ActionButton>
          <ActionButton
            type="button"
            variant="link"
            onClick={returnToPasswordStep}
          >
            Sign in with a different account
          </ActionButton>
        </div>
      )}

      {stage.kind === "enrollment" && (
        <form
          className="flex flex-col items-center gap-5"
          onSubmit={handleEnrollmentSubmit}
        >
          <QrCode
            value={stage.setup.otpauthUrl}
            label="Scan to add HealthAlyst to your authenticator app"
            size={STAFF_AUTHENTICATOR_CONFIGURATION.imageSize}
          />
          <p className="text-center text-sm text-muted-foreground">
            Scan the QR code, or enter the setup key manually.
          </p>
          <p className="rounded-md bg-muted px-3 py-2 font-mono text-sm tracking-wider">
            {stage.setup.secret}
          </p>
          <OneTimeCodeField
            id="staff-enrollment-code"
            label="First authenticator code"
            length={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
            value={verificationCode}
            disabled={authenticatorConfirmationMutation.isPending}
            onChange={setVerificationCode}
          />
          {authenticatorConfirmationMutation.error && (
            <FormMessage tone="error" align="center">
              {authenticatorConfirmationMutation.error.message}
            </FormMessage>
          )}
          <ActionButton
            type="submit"
            size="large"
            className="w-full"
            isLoading={authenticatorConfirmationMutation.isPending}
            loadingText="Protecting account"
            disabled={
              verificationCode.length !==
              STAFF_AUTHENTICATOR_CONFIGURATION.codeLength
            }
          >
            Confirm authenticator
          </ActionButton>
        </form>
      )}

      {stage.kind === "recovery-codes" && (
        <RecoveryCodesPanel
          recoveryCodes={stage.recoveryCodes}
          downloadFileName={STAFF_RECOVERY_CODES_FILE.name}
          downloadHeading={STAFF_RECOVERY_CODES_FILE.heading}
          confirmationIdentifier="staff-recovery-codes-saved"
          hasSavedCodes={hasSavedRecoveryCodes}
          onHasSavedCodesChange={setHasSavedRecoveryCodes}
          continueLabel="Continue to HealthAlyst"
          onContinue={finishAuthenticatorEnrollment}
        />
      )}
    </StaffAuthLayout>
  );
}
