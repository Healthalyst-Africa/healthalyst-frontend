"use client";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { useSignInWorkflow } from "~/features/authentication/hooks/use-sign-in-workflow";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@healthalyst/ui/components/input-otp";
import { PasswordInput } from "@healthalyst/ui/components/password-input";
import { cn } from "@healthalyst/ui/lib/utilities";
import OrganizationSignInLayout from "~/components/ui/organization-sign-in-layout";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import AuthenticatorEnrolment from "~/features/authentication/components/authenticator-enrolment";
import { SIGN_IN_LIMITS } from "~/features/authentication/config/authentication-limits";
import { clearFieldError } from "~/shared/forms/form-validation";
import { AuthenticatedApplicationRedirectState } from "~/features/authentication/components/authenticated-application-redirect-state";

function ApiErrorMessage({ error }: { error: Error }) {
  return (
    <div role="alert" className="flex flex-col gap-1">
      <FieldError>{error.message}</FieldError>
      {error instanceof PlatformApiError &&
        error.code === "EMAIL_NOT_VERIFIED" && (
          <p className="text-sm text-muted-foreground">
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href={ORGANIZATION_ROUTES.verifyEmail}
            >
              Request a new confirmation link
            </Link>
          </p>
        )}
    </div>
  );
}

/**
 * Complete the Platform API password/MFA contract. Challenges stay in the
 * current workflow and access credentials stay in the browser transport.
 */
export default function SignIn() {
  const {
    stage,
    fieldErrors,
    setFieldErrors,
    stageNotice,
    headingReference,
    passwordMutation,
    codeMutation,
    platformSession,
    isRestoring,
    isRedirecting,
    redirectError,
    showStage,
    completeSignIn,
    handlePasswordSubmit,
    handleCodeSubmit,
    handleCodeChange,
  } = useSignInWorkflow();

  if (stage.kind === "enrolment-required") {
    return (
      <OrganizationSignInLayout>
        <AuthenticatorEnrolment
          enrolmentToken={stage.enrolmentToken}
          onEnrolled={(confirmation) =>
            confirmation.session
              ? completeSignIn(confirmation.session)
              : showStage(
                  { kind: "password" },
                  "Your authenticator app is set up. Sign in to continue."
                )
          }
        />
      </OrganizationSignInLayout>
    );
  }

  if (platformSession && (isRedirecting || redirectError)) {
    return (
      <OrganizationSignInLayout>
        <AuthenticatedApplicationRedirectState
          platformSession={platformSession}
          isRedirecting={isRedirecting}
          redirectError={redirectError}
        />
      </OrganizationSignInLayout>
    );
  }

  if (isRestoring) {
    return (
      <OrganizationSignInLayout>
        <Card className="border-border bg-card shadow-sm" aria-busy="true">
          <CardContent className="px-5 py-6 sm:px-6 md:px-8 md:py-8">
            <p className="text-sm text-muted-foreground" role="status">
              Checking your sign-in…
            </p>
          </CardContent>
        </Card>
      </OrganizationSignInLayout>
    );
  }

  const heading = stage.kind === "code" ? "Enter your sign-in code" : "Sign in";

  const introduction =
    stage.kind === "code"
      ? stage.method === "totp"
        ? "Open your authenticator app and enter the 6-digit code for HealthAlyst."
        : "Enter one of the recovery codes you saved when you set up your authenticator app. Each code works once."
      : "Use the administrator email address and password from registration.";

  const footerContent = (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        {stage.kind === "password" ? (
          <>
            New to HealthAlyst?{" "}
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href={ORGANIZATION_ROUTES.registration}
            >
              Register your organisation
            </Link>
          </>
        ) : (
          <ActionButton
            className="h-auto px-0 text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline"
            size="unstyled"
            type="button"
            variant="link"
            disabled={codeMutation.isPending}
            onClick={() => showStage({ kind: "password" })}
          >
            Sign in with a different account
          </ActionButton>
        )}
      </p>
    </div>
  );

  return (
    <OrganizationSignInLayout footerContent={footerContent}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
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
            {stageNotice && (
              <p className="text-sm text-muted-foreground" role="status">
                {stageNotice}
              </p>
            )}

            {stage.kind === "password" && (
              <form
                className="flex flex-col gap-5"
                onSubmit={handlePasswordSubmit}
                noValidate
              >
                <FieldGroup className="gap-5">
                  <Field
                    className="gap-1.5"
                    data-invalid={Boolean(fieldErrors.identifier)}
                  >
                    <FieldLabel htmlFor="sign-in-identifier">
                      Work email address
                    </FieldLabel>
                    <Input
                      autoComplete="username"
                      id="sign-in-identifier"
                      name="identifier"
                      type="email"
                      maxLength={SIGN_IN_LIMITS.identifierMaximum}
                      required
                      disabled={passwordMutation.isPending}
                      aria-invalid={
                        Boolean(fieldErrors.identifier) || undefined
                      }
                      aria-describedby={
                        fieldErrors.identifier
                          ? "sign-in-identifier-error"
                          : undefined
                      }
                      onChange={() =>
                        setFieldErrors((currentErrors) =>
                          clearFieldError(currentErrors, "identifier")
                        )
                      }
                    />
                    {fieldErrors.identifier && (
                      <FieldError id="sign-in-identifier-error">
                        {fieldErrors.identifier}
                      </FieldError>
                    )}
                  </Field>
                  <Field
                    className="gap-1.5"
                    data-invalid={Boolean(fieldErrors.password)}
                  >
                    <FieldLabel htmlFor="sign-in-password">Password</FieldLabel>
                    <PasswordInput
                      autoComplete="current-password"
                      id="sign-in-password"
                      name="password"
                      maxLength={SIGN_IN_LIMITS.passwordMaximum}
                      required
                      visibilityLabel="Password"
                      disabled={passwordMutation.isPending}
                      aria-invalid={Boolean(fieldErrors.password) || undefined}
                      aria-describedby={
                        fieldErrors.password
                          ? "sign-in-password-error"
                          : undefined
                      }
                      onChange={() =>
                        setFieldErrors((currentErrors) =>
                          clearFieldError(currentErrors, "password")
                        )
                      }
                    />
                    {fieldErrors.password && (
                      <FieldError id="sign-in-password-error">
                        {fieldErrors.password}
                      </FieldError>
                    )}
                  </Field>
                </FieldGroup>
                <p className="-mt-3 self-end text-sm">
                  <Link
                    className="text-primary underline-offset-4 hover:underline"
                    href={ORGANIZATION_ROUTES.forgotPassword}
                  >
                    Forgot password?
                  </Link>
                </p>
                {passwordMutation.error && (
                  <ApiErrorMessage error={passwordMutation.error} />
                )}
                <ActionButton
                  className="w-full"
                  size="large"
                  type="submit"
                  isLoading={passwordMutation.isPending}
                  loadingText="Signing in"
                >
                  Sign in
                </ActionButton>
              </form>
            )}

            {stage.kind === "code" && (
              <form
                className="flex flex-col gap-5"
                onSubmit={handleCodeSubmit}
                noValidate
              >
                <Field
                  className={cn(
                    "gap-1.5",
                    stage.method === "totp" && "items-center gap-3"
                  )}
                  data-invalid={Boolean(fieldErrors.code)}
                  data-disabled={codeMutation.isPending}
                >
                  <FieldLabel
                    className={cn(stage.method === "totp" && "justify-center")}
                    htmlFor="sign-in-code"
                  >
                    {stage.method === "totp"
                      ? "Authenticator code"
                      : "Recovery code"}
                  </FieldLabel>
                  {stage.method === "totp" ? (
                    <InputOTP
                      autoComplete="one-time-code"
                      autoFocus
                      id="sign-in-code"
                      name="code"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="^[0-9]*$"
                      pasteTransformer={(pastedCode) =>
                        pastedCode.replace(/[\s-]/g, "")
                      }
                      required
                      disabled={codeMutation.isPending}
                      aria-invalid={Boolean(fieldErrors.code) || undefined}
                      aria-describedby={
                        fieldErrors.code ? "sign-in-code-error" : undefined
                      }
                      onChange={handleCodeChange}
                      containerClassName="justify-center gap-3"
                    >
                      <InputOTPGroup>
                        {[0, 1, 2].map((slotIndex) => (
                          <InputOTPSlot
                            key={slotIndex}
                            index={slotIndex}
                            className="h-12 w-9 bg-card text-lg font-medium tabular-nums sm:w-11"
                          />
                        ))}
                      </InputOTPGroup>
                      <InputOTPGroup>
                        {[3, 4, 5].map((slotIndex) => (
                          <InputOTPSlot
                            key={slotIndex}
                            index={slotIndex}
                            className="h-12 w-9 bg-card text-lg font-medium tabular-nums sm:w-11"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  ) : (
                    <Input
                      autoComplete="one-time-code"
                      autoFocus
                      id="sign-in-code"
                      name="code"
                      type="text"
                      maxLength={SIGN_IN_LIMITS.recoveryCodeMaximum}
                      required
                      disabled={codeMutation.isPending}
                      aria-invalid={Boolean(fieldErrors.code) || undefined}
                      aria-describedby={
                        fieldErrors.code ? "sign-in-code-error" : undefined
                      }
                      onChange={handleCodeChange}
                    />
                  )}
                  {fieldErrors.code && (
                    <FieldError id="sign-in-code-error">
                      {fieldErrors.code}
                    </FieldError>
                  )}
                </Field>
                {codeMutation.error && (
                  <ApiErrorMessage error={codeMutation.error} />
                )}
                <ActionButton
                  className="w-full"
                  size="large"
                  type="submit"
                  isLoading={codeMutation.isPending}
                  loadingText="Checking the code"
                >
                  Continue
                </ActionButton>
                {stage.methods.length > 1 && (
                  <ActionButton
                    className="self-center font-normal"
                    size="small"
                    type="button"
                    variant="link"
                    disabled={codeMutation.isPending}
                    onClick={() =>
                      showStage({
                        ...stage,
                        method:
                          stage.method === "totp" ? "recovery_code" : "totp",
                      })
                    }
                  >
                    {stage.method === "totp"
                      ? "Use a recovery code instead"
                      : "Use your authenticator app instead"}
                  </ActionButton>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizationSignInLayout>
  );
}
