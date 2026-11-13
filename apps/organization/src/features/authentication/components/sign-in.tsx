"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import { ORGANIZATION_ROUTES } from "~/config/routes";

import Link from "next/link";
import { useSignInWorkflow } from "~/features/authentication/hooks/use-sign-in-workflow";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { SignInForm } from "@healthalyst/ui/components/sign-in-form";
import OrganizationCenteredLayout from "~/components/ui/organization-centered-layout";
import OrganizationSignInLayout from "~/components/ui/organization-sign-in-layout";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import AuthenticatorEnrolment from "~/features/authentication/components/authenticator-enrolment";
import { SIGN_IN_LIMITS } from "~/features/authentication/config/authentication-limits";
import { clearFieldError } from "~/shared/forms/form-validation";
import { AuthenticatedApplicationRedirectState } from "~/features/authentication/components/authenticated-application-redirect-state";
import type { OrganizationProductCode } from "~/shared/organization/config/organization-products";

/** The request's failure, with a way to recover when the email is unconfirmed. */
function describeSignInError(error: Error | null) {
  if (!error) return null;
  return {
    message: error.message,
    details: error instanceof PlatformApiError &&
      error.code === "EMAIL_NOT_VERIFIED" && (
        <p className="text-sm text-muted-foreground">
          <Link
            className="font-semibold text-primary underline underline-offset-4"
            href={ORGANIZATION_ROUTES.verifyEmail}
          >
            Request a new confirmation link
          </Link>
        </p>
      ),
  };
}

/**
 * Complete the Platform API password/MFA contract. Challenges stay in the
 * current workflow and access credentials stay in the browser transport.
 */
export default function SignIn({
  requestedProductCodes,
}: {
  /** Products named by the product app that sent the person here. */
  requestedProductCodes: readonly OrganizationProductCode[];
}) {
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
    redirectMessage,
    showStage,
    completeSignIn,
    handlePasswordSubmit,
    handleCodeSubmit,
    handleCodeChange,
  } = useSignInWorkflow({ requestedProductCodes });

  if (stage.kind === "enrolment-required") {
    return (
      <OrganizationCenteredLayout pageTitle="Set up your authenticator app">
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
      </OrganizationCenteredLayout>
    );
  }

  if (platformSession && (isRedirecting || redirectError)) {
    return (
      <OrganizationCenteredLayout
        pageTitle={isRedirecting ? "Opening HealthAlyst" : "Sign-in complete"}
      >
        <AuthenticatedApplicationRedirectState
          isRedirecting={isRedirecting}
          redirectError={redirectError}
          redirectMessage={redirectMessage}
        />
      </OrganizationCenteredLayout>
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

  const signInForm = (
    <SignInForm
      identifier="sign-in"
      stage={
        stage.kind === "code"
          ? {
              kind: "code",
              method: stage.method,
              canSwitchMethod: stage.methods.length > 1,
            }
          : { kind: "password" }
      }
      heading={heading}
      introduction={introduction}
      headingReference={headingReference}
      notice={stageNotice}
      fieldErrors={fieldErrors}
      error={describeSignInError(
        stage.kind === "code" ? codeMutation.error : passwordMutation.error
      )}
      isSubmitting={
        stage.kind === "code"
          ? codeMutation.isPending
          : passwordMutation.isPending
      }
      limits={SIGN_IN_LIMITS}
      forgotPasswordLink={
        <Link href={ORGANIZATION_ROUTES.forgotPassword}>Forgot password?</Link>
      }
      onPasswordSubmit={handlePasswordSubmit}
      onCodeSubmit={handleCodeSubmit}
      onFieldChange={(fieldName) =>
        fieldName === "code"
          ? handleCodeChange()
          : setFieldErrors((currentErrors) =>
              clearFieldError(currentErrors, fieldName)
            )
      }
      onSwitchMethod={() => {
        if (stage.kind !== "code") return;
        showStage({
          ...stage,
          method: stage.method === "totp" ? "recovery_code" : "totp",
        });
      }}
    />
  );

  // Only the first sign-in screen has the showcase; the code step is centred.
  return stage.kind === "code" ? (
    <OrganizationCenteredLayout
      pageTitle={heading}
      footerContent={footerContent}
    >
      {signInForm}
    </OrganizationCenteredLayout>
  ) : (
    <OrganizationSignInLayout footerContent={footerContent}>
      {signInForm}
    </OrganizationSignInLayout>
  );
}
