"use client";

import Image from "next/image";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@healthalyst/ui/components/input-otp";
import { Input } from "@healthalyst/ui/components/input";
import { PasswordInput } from "@healthalyst/ui/components/password-input";
import { QrCode } from "@healthalyst/ui/components/qr-code";
import { useStaffSignInFlow } from "~/features/staff-auth/hooks/use-staff-sign-in-flow";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";

export function StaffSignInForm() {
  const {
    stage,
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
    handleEnrollmentSubmit,
    returnToPasswordStep,
    finishAuthenticatorEnrollment,
    stageTitle,
    stageDescription,
  } = useStaffSignInFlow();

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="flex w-full max-w-md flex-col gap-7">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="HealthAlyst Africa"
            width={52}
            height={52}
          />
          <div>
            <p className="font-serif text-xl font-normal">HealthAlyst</p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Super Admin
            </p>
          </div>
        </div>
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif text-3xl font-normal leading-tight">
            {stageTitle}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {stageDescription}
          </p>
        </header>
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="px-7 py-8">
            {stage.kind === "password" && (
              <form
                className="flex flex-col gap-5"
                onSubmit={handlePasswordSubmit}
                noValidate
              >
                <FieldGroup className="gap-5">
                  <Field
                    className="gap-1.5"
                    data-invalid={Boolean(fieldErrors.emailAddress)}
                  >
                    <FieldLabel htmlFor="staff-email-address">
                      Work email address
                    </FieldLabel>
                    <Input
                      id="staff-email-address"
                      name="emailAddress"
                      type="email"
                      autoComplete="username"
                      aria-invalid={
                        Boolean(fieldErrors.emailAddress) || undefined
                      }
                      aria-describedby={
                        fieldErrors.emailAddress
                          ? "staff-email-error"
                          : undefined
                      }
                      onChange={() => clearFieldError("emailAddress")}
                    />
                    {fieldErrors.emailAddress && (
                      <FieldError id="staff-email-error">
                        {fieldErrors.emailAddress}
                      </FieldError>
                    )}
                  </Field>
                  <Field
                    className="gap-1.5"
                    data-invalid={Boolean(fieldErrors.password)}
                  >
                    <FieldLabel htmlFor="staff-password">Password</FieldLabel>
                    <PasswordInput
                      id="staff-password"
                      name="password"
                      autoComplete="current-password"
                      visibilityLabel="Password"
                      aria-invalid={Boolean(fieldErrors.password) || undefined}
                      aria-describedby={
                        fieldErrors.password
                          ? "staff-password-error"
                          : undefined
                      }
                      onChange={() => clearFieldError("password")}
                    />
                    {fieldErrors.password && (
                      <FieldError id="staff-password-error">
                        {fieldErrors.password}
                      </FieldError>
                    )}
                  </Field>
                </FieldGroup>
                {passwordMutation.error && (
                  <FieldError role="alert">
                    {passwordMutation.error.message}
                  </FieldError>
                )}
                {sessionError && !passwordMutation.error && (
                  <FieldError role="alert">{sessionError}</FieldError>
                )}
                {authenticatorSetupMutation.error && (
                  <FieldError role="alert">
                    {authenticatorSetupMutation.error.message}
                  </FieldError>
                )}
                <ActionButton
                  type="submit"
                  size="large"
                  className="w-full"
                  isLoading={
                    passwordMutation.isPending ||
                    authenticatorSetupMutation.isPending ||
                    status === "loading"
                  }
                  loadingText="Signing in"
                >
                  Sign in
                </ActionButton>
              </form>
            )}

            {stage.kind === "verification" && (
              <form
                className="flex flex-col items-center gap-6"
                onSubmit={handleVerificationSubmit}
              >
                <Field className="items-center gap-2">
                  <FieldLabel htmlFor="staff-authenticator-code">
                    {stage.method === "totp"
                      ? "Authenticator code"
                      : "Recovery code"}
                  </FieldLabel>
                  {stage.method === "totp" ? (
                    <InputOTP
                      id="staff-authenticator-code"
                      aria-label="Six-digit authenticator code"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
                      value={verificationCode}
                      onChange={setVerificationCode}
                      disabled={verificationMutation.isPending}
                    >
                      <InputOTPGroup>
                        {STAFF_AUTHENTICATOR_CONFIGURATION.slotIndices
                          .slice(
                            0,
                            STAFF_AUTHENTICATOR_CONFIGURATION.groupLength
                          )
                          .map((oneTimePasswordSlotIndex) => (
                            <InputOTPSlot
                              key={oneTimePasswordSlotIndex}
                              index={oneTimePasswordSlotIndex}
                            />
                          ))}
                      </InputOTPGroup>
                      <InputOTPGroup>
                        {STAFF_AUTHENTICATOR_CONFIGURATION.slotIndices
                          .slice(STAFF_AUTHENTICATOR_CONFIGURATION.groupLength)
                          .map((oneTimePasswordSlotIndex) => (
                            <InputOTPSlot
                              key={oneTimePasswordSlotIndex}
                              index={oneTimePasswordSlotIndex}
                            />
                          ))}
                      </InputOTPGroup>
                    </InputOTP>
                  ) : (
                    <Input
                      id="staff-authenticator-code"
                      autoComplete="one-time-code"
                      value={verificationCode}
                      onChange={(changeEvent) =>
                        setVerificationCode(changeEvent.target.value)
                      }
                      disabled={verificationMutation.isPending}
                    />
                  )}
                </Field>
                {verificationMutation.error && (
                  <FieldError role="alert">
                    {verificationMutation.error.message}
                  </FieldError>
                )}
                <ActionButton
                  type="submit"
                  size="large"
                  className="w-full"
                  isLoading={verificationMutation.isPending}
                  loadingText="Checking code"
                  disabled={
                    stage.method === "totp"
                      ? verificationCode.length !==
                        STAFF_AUTHENTICATOR_CONFIGURATION.codeLength
                      : verificationCode.trim().length <
                        STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMinimumLength
                  }
                >
                  Continue
                </ActionButton>
                {stage.methods.length > 1 && (
                  <ActionButton
                    type="button"
                    variant="link"
                    onClick={toggleVerificationMethod}
                  >
                    {stage.method === "totp"
                      ? "Use a recovery code instead"
                      : "Use an authenticator code instead"}
                  </ActionButton>
                )}
                <ActionButton
                  type="button"
                  variant="link"
                  onClick={returnToPasswordStep}
                >
                  Sign in with a different account
                </ActionButton>
              </form>
            )}

            {stage.kind === "enrollment-loading" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <p role="status" className="text-sm text-muted-foreground">
                  Preparing authenticator setup…
                </p>
                {authenticatorSetupMutation.error && (
                  <FieldError role="alert">
                    {authenticatorSetupMutation.error.message}
                  </FieldError>
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
                <Field className="items-center gap-2">
                  <FieldLabel htmlFor="staff-enrollment-code">
                    First authenticator code
                  </FieldLabel>
                  <InputOTP
                    id="staff-enrollment-code"
                    aria-label="Six-digit authenticator code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={STAFF_AUTHENTICATOR_CONFIGURATION.codeLength}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    disabled={authenticatorConfirmationMutation.isPending}
                  >
                    <InputOTPGroup>
                      {STAFF_AUTHENTICATOR_CONFIGURATION.slotIndices
                        .slice(0, STAFF_AUTHENTICATOR_CONFIGURATION.groupLength)
                        .map((oneTimePasswordSlotIndex) => (
                          <InputOTPSlot
                            key={oneTimePasswordSlotIndex}
                            index={oneTimePasswordSlotIndex}
                          />
                        ))}
                    </InputOTPGroup>
                    <InputOTPGroup>
                      {STAFF_AUTHENTICATOR_CONFIGURATION.slotIndices
                        .slice(STAFF_AUTHENTICATOR_CONFIGURATION.groupLength)
                        .map((oneTimePasswordSlotIndex) => (
                          <InputOTPSlot
                            key={oneTimePasswordSlotIndex}
                            index={oneTimePasswordSlotIndex}
                          />
                        ))}
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
                {authenticatorConfirmationMutation.error && (
                  <FieldError role="alert">
                    {authenticatorConfirmationMutation.error.message}
                  </FieldError>
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
              <div className="flex flex-col gap-5">
                <ul className="max-h-48 list-inside list-decimal space-y-2 overflow-y-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-sm">
                  {stage.recoveryCodes.map((recoveryCode) => (
                    <li key={recoveryCode}>{recoveryCode}</li>
                  ))}
                </ul>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hasSavedRecoveryCodes}
                    onChange={(changeEvent) =>
                      setHasSavedRecoveryCodes(changeEvent.target.checked)
                    }
                    className="mt-0.5 size-4 accent-primary"
                  />
                  <span>I have saved my recovery codes somewhere safe.</span>
                </label>
                <ActionButton
                  type="button"
                  size="large"
                  className="w-full"
                  disabled={!hasSavedRecoveryCodes}
                  onClick={finishAuthenticatorEnrollment}
                >
                  Continue to HealthAlyst
                </ActionButton>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
