"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { useSignInWorkflow } from "~/features/authentication/hooks/use-sign-in-workflow";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { OneTimeCodeField } from "@healthalyst/ui/components/one-time-code-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import OrganizationSignInLayout from "~/components/ui/organization-sign-in-layout";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import AuthenticatorEnrolment from "~/features/authentication/components/authenticator-enrolment";
import { SIGN_IN_LIMITS } from "~/features/authentication/config/authentication-limits";
import { clearFieldError } from "~/shared/forms/form-validation";
import { AuthenticatedApplicationRedirectState } from "~/features/authentication/components/authenticated-application-redirect-state";

function ApiErrorMessage({ error }: { error: Error }) {
  return (
    <FormMessage
      tone="error"
      details={
        error instanceof PlatformApiError &&
        error.code === "EMAIL_NOT_VERIFIED" && (
          <p className="text-sm text-muted-foreground">
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href={ORGANIZATION_ROUTES.verifyEmail}
            >
              Request a new confirmation link
            </Link>
          </p>
        )
      }
    >
      {error.message}
    </FormMessage>
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
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Checking your sign-in"
      />
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

        <ContentPanel>
          {stageNotice && (
            <FormMessage tone="status">{stageNotice}</FormMessage>
          )}

          {stage.kind === "password" && (
            <form
              className="flex flex-col gap-5"
              onSubmit={handlePasswordSubmit}
              noValidate
            >
              <TextField
                autoComplete="username"
                id="sign-in-identifier"
                label="Work email address"
                name="identifier"
                type="email"
                maxLength={SIGN_IN_LIMITS.identifierMaximum}
                required
                disabled={passwordMutation.isPending}
                error={fieldErrors.identifier}
                onChange={() =>
                  setFieldErrors((currentErrors) =>
                    clearFieldError(currentErrors, "identifier")
                  )
                }
              />
              <TextField
                autoComplete="current-password"
                id="sign-in-password"
                label="Password"
                name="password"
                type="password"
                maxLength={SIGN_IN_LIMITS.passwordMaximum}
                required
                disabled={passwordMutation.isPending}
                error={fieldErrors.password}
                onChange={() =>
                  setFieldErrors((currentErrors) =>
                    clearFieldError(currentErrors, "password")
                  )
                }
              />
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
              {stage.method === "totp" ? (
                <OneTimeCodeField
                  autoFocus
                  id="sign-in-code"
                  label="Authenticator code"
                  name="code"
                  required
                  disabled={codeMutation.isPending}
                  error={fieldErrors.code}
                  onChange={handleCodeChange}
                />
              ) : (
                <TextField
                  autoComplete="one-time-code"
                  autoFocus
                  id="sign-in-code"
                  label="Recovery code"
                  name="code"
                  maxLength={SIGN_IN_LIMITS.recoveryCodeMaximum}
                  required
                  disabled={codeMutation.isPending}
                  error={fieldErrors.code}
                  onChange={handleCodeChange}
                />
              )}
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
        </ContentPanel>
      </div>
    </OrganizationSignInLayout>
  );
}
