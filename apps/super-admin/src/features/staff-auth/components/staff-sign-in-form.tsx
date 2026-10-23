"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
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
import {
  confirmStaffAuthenticatorSetup,
  createStaffSession,
  startStaffAuthenticatorSetup,
  verifyStaffSignInCode,
  type AuthenticatorSetup,
  type PasswordStepResponse,
  type SignInMethod,
  type StaffIdentity,
} from "~/features/staff-auth/api/staff-service";
import { useStaffSession } from "~/features/staff-auth/context/staff-session-provider";
import { staffSignInSchema } from "~/features/staff-auth/model/staff-sign-in-schema";

type StaffSignInStage =
  | { kind: "password" }
  | {
      kind: "mfa";
      methods: SignInMethod[];
      method: SignInMethod;
    }
  | { kind: "enrollment-loading" }
  | {
      kind: "enrollment";
      setup: AuthenticatorSetup;
    }
  | {
      kind: "recovery-codes";
      staffIdentity: StaffIdentity;
      recoveryCodes: string[];
    };

const oneTimePasswordSlotIndices = [0, 1, 2, 3, 4, 5];

export function StaffSignInForm() {
  const router = useRouter();
  const { setStaffIdentity, staffIdentity, status } = useStaffSession();
  const [stage, setStage] = useState<StaffSignInStage>({ kind: "password" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verificationCode, setVerificationCode] = useState("");
  const [hasSavedRecoveryCodes, setHasSavedRecoveryCodes] = useState(false);

  const authenticatorSetupMutation = useMutation({
    mutationFn: startStaffAuthenticatorSetup,
    onSuccess: (setup) => setStage({ kind: "enrollment", setup }),
  });

  const passwordMutation = useMutation({
    mutationFn: ({
      emailAddress,
      password,
    }: {
      emailAddress: string;
      password: string;
    }) => createStaffSession(emailAddress, password),
    onSuccess: (passwordStep: PasswordStepResponse) => {
      setVerificationCode("");
      if (passwordStep.status === "MFA_REQUIRED") {
        const method = passwordStep.methods.includes("totp")
          ? "totp"
          : passwordStep.methods[0];
        if (!method) return;
        setStage({
          kind: "mfa",
          methods: passwordStep.methods,
          method,
        });
        return;
      }
      setStage({ kind: "enrollment-loading" });
      authenticatorSetupMutation.mutate();
    },
  });

  const mfaMutation = useMutation({
    mutationFn: verifyStaffSignInCode,
    onSuccess: (nextStaffIdentity) => {
      setStaffIdentity(nextStaffIdentity);
      router.replace("/dashboard");
    },
  });

  const authenticatorConfirmationMutation = useMutation({
    mutationFn: confirmStaffAuthenticatorSetup,
    onSuccess: ({ staffIdentity: nextStaffIdentity, recoveryCodes }) => {
      setHasSavedRecoveryCodes(false);
      setStage({
        kind: "recovery-codes",
        staffIdentity: nextStaffIdentity,
        recoveryCodes,
      });
    },
  });

  useEffect(() => {
    if (staffIdentity) router.replace("/dashboard");
  }, [router, staffIdentity]);

  function handlePasswordSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const formData = new FormData(formElement);
    const result = staffSignInSchema.safeParse({
      emailAddress: formData.get("emailAddress"),
      password: formData.get("password"),
    });
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors({
        emailAddress: errors.emailAddress?.[0] ?? "",
        password: errors.password?.[0] ?? "",
      });
      const firstInvalidField = formElement.querySelector<HTMLInputElement>(
        `[name="${errors.emailAddress?.length ? "emailAddress" : "password"}"]`
      );
      firstInvalidField?.focus();
      return;
    }
    setFieldErrors({});
    passwordMutation.mutate(result.data);
  }

  function handleVerificationSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (stage.kind !== "mfa") return;
    mfaMutation.mutate({
      method: stage.method,
      code: verificationCode,
    });
  }

  function handleEnrollmentSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (stage.kind !== "enrollment") return;
    authenticatorConfirmationMutation.mutate({
      factorId: stage.setup.factorId,
      code: verificationCode,
    });
  }

  function returnToPasswordStep() {
    setVerificationCode("");
    setStage({ kind: "password" });
    passwordMutation.reset();
    authenticatorSetupMutation.reset();
    mfaMutation.reset();
    authenticatorConfirmationMutation.reset();
  }

  function finishAuthenticatorEnrollment() {
    if (stage.kind !== "recovery-codes" || !hasSavedRecoveryCodes) return;
    setStaffIdentity(stage.staffIdentity);
    router.replace("/dashboard");
  }

  const stageTitle =
    stage.kind === "password"
      ? "Staff sign in"
      : stage.kind === "mfa"
        ? "Enter your sign-in code"
        : stage.kind === "recovery-codes"
          ? "Save your recovery codes"
          : "Protect your account";
  const stageDescription =
    stage.kind === "password"
      ? "Use your HealthAlyst staff account to open the company dashboard."
      : stage.kind === "mfa"
        ? "Open your authenticator app and enter the code for HealthAlyst."
        : stage.kind === "recovery-codes"
          ? "Keep these codes somewhere safe. Each code can be used once if you lose access to your authenticator."
          : "Add HealthAlyst to an authenticator app. You will use a code from it each time you sign in.";

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
                      onChange={() =>
                        setFieldErrors((errors) => ({
                          ...errors,
                          emailAddress: "",
                        }))
                      }
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
                      onChange={() =>
                        setFieldErrors((errors) => ({
                          ...errors,
                          password: "",
                        }))
                      }
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

            {stage.kind === "mfa" && (
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
                      maxLength={6}
                      value={verificationCode}
                      onChange={setVerificationCode}
                      disabled={mfaMutation.isPending}
                    >
                      <InputOTPGroup>
                        {oneTimePasswordSlotIndices
                          .slice(0, 3)
                          .map((oneTimePasswordSlotIndex) => (
                            <InputOTPSlot
                              key={oneTimePasswordSlotIndex}
                              index={oneTimePasswordSlotIndex}
                            />
                          ))}
                      </InputOTPGroup>
                      <InputOTPGroup>
                        {oneTimePasswordSlotIndices
                          .slice(3)
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
                      disabled={mfaMutation.isPending}
                    />
                  )}
                </Field>
                {mfaMutation.error && (
                  <FieldError role="alert">
                    {mfaMutation.error.message}
                  </FieldError>
                )}
                <ActionButton
                  type="submit"
                  size="large"
                  className="w-full"
                  isLoading={mfaMutation.isPending}
                  loadingText="Checking code"
                  disabled={
                    stage.method === "totp"
                      ? verificationCode.length !== 6
                      : verificationCode.trim().length < 6
                  }
                >
                  Continue
                </ActionButton>
                {stage.methods.length > 1 && (
                  <ActionButton
                    type="button"
                    variant="link"
                    onClick={() => {
                      setVerificationCode("");
                      setStage({
                        ...stage,
                        method:
                          stage.method === "totp" ? "recovery_code" : "totp",
                      });
                    }}
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
                  onClick={() => authenticatorSetupMutation.mutate()}
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
                  size={176}
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
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    disabled={authenticatorConfirmationMutation.isPending}
                  >
                    <InputOTPGroup>
                      {oneTimePasswordSlotIndices
                        .slice(0, 3)
                        .map((oneTimePasswordSlotIndex) => (
                          <InputOTPSlot
                            key={oneTimePasswordSlotIndex}
                            index={oneTimePasswordSlotIndex}
                          />
                        ))}
                    </InputOTPGroup>
                    <InputOTPGroup>
                      {oneTimePasswordSlotIndices
                        .slice(3)
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
                  disabled={verificationCode.length !== 6}
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
