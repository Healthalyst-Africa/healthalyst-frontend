"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Badge } from "@healthalyst/ui/components/badge";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import { PasswordInput } from "@healthalyst/ui/components/password-input";
import { PlatformApiError } from "~/features/organization-onboarding/api/platform-api-error";
import type {
  PlatformSession,
  SignInMethod,
} from "~/features/organization-onboarding/api/platform-authentication-service";
import {
  usePasswordSignInMutation,
  useSignInCodeMutation,
  useSignOutMutation,
} from "~/features/organization-onboarding/hooks/use-sign-in";
import {
  authenticatorCodeSchema,
  passwordStepSchema,
  recoveryCodeSchema,
  SIGN_IN_LIMITS,
} from "~/features/organization-onboarding/model/sign-in-schema";
import {
  clearFieldError,
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";

type SignInStage =
  | { kind: "password" }
  | {
      kind: "code";
      mfaToken: string;
      methods: readonly SignInMethod[];
      method: SignInMethod;
    }
  | { kind: "enrolment-required" }
  | { kind: "signed-in"; session: PlatformSession };

/** Organisation and application statuses from the Platform API. */
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_VERIFICATION: "Waiting for verification",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  ACTIVE: "Approved",
  SUSPENDED: "Suspended",
  REJECTED: "Not approved",
  DEACTIVATED: "Deactivated",
};

function describeStatus(status: string): string {
  return (
    STATUS_LABELS[status] ??
    status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")
  );
}

function ApiErrorMessage({ error }: { error: Error }) {
  return (
    <div role="alert" className="flex flex-col gap-1">
      <FieldError>{error.message}</FieldError>
      {error instanceof PlatformApiError &&
        error.code === "EMAIL_NOT_VERIFIED" && (
          <p className="text-sm text-muted-foreground">
            <Link
              className="font-semibold text-primary underline underline-offset-4"
              href="/verify-email"
            >
              Request a new confirmation link
            </Link>
          </p>
        )}
      {error instanceof PlatformApiError && error.requestId && (
        <p className="text-xs text-muted-foreground">
          Reference for HealthAlyst support:{" "}
          <span className="font-mono">{error.requestId}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Sign-in against the Platform API: the password step
 * (`POST /v1/auth/login`), then a code from the authenticator app or a
 * recovery code (`POST /v1/auth/mfa/verify`). The session's access token is
 * kept in memory only, so it ends when the page is closed or reloaded.
 */
export default function SignIn() {
  const [stage, setStage] = useState<SignInStage>({ kind: "password" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stageNotice, setStageNotice] = useState<string | null>(null);
  const headingReference = useRef<HTMLHeadingElement>(null);
  const hasChangedStageReference = useRef(false);
  const passwordMutation = usePasswordSignInMutation();
  const codeMutation = useSignInCodeMutation();
  const signOutMutation = useSignOutMutation();

  useEffect(() => {
    // Move focus to the new heading when the stage changes, not on load.
    if (!hasChangedStageReference.current) {
      hasChangedStageReference.current = true;
      return;
    }
    headingReference.current?.focus();
  }, [stage.kind]);

  function showStage(nextStage: SignInStage, notice: string | null = null) {
    setFieldErrors({});
    setStageNotice(notice);
    passwordMutation.reset();
    codeMutation.reset();
    setStage(nextStage);
  }

  function handlePasswordSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const validationResult = parseFormData(
      passwordStepSchema,
      new FormData(formElement)
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formElement, validationResult.errors);
      return;
    }
    setFieldErrors({});
    setStageNotice(null);
    passwordMutation.mutate(validationResult.data, {
      onSuccess: (passwordStep) => {
        if (passwordStep.status === "MFA_ENROLMENT_REQUIRED") {
          showStage({ kind: "enrolment-required" });
          return;
        }
        const method = passwordStep.methods.includes("totp")
          ? "totp"
          : (passwordStep.methods[0] ?? "totp");
        showStage({
          kind: "code",
          mfaToken: passwordStep.mfaToken,
          methods: passwordStep.methods,
          method,
        });
      },
    });
  }

  function handleCodeSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (stage.kind !== "code") return;
    const formElement = formEvent.currentTarget;
    const validationResult = parseFormData(
      stage.method === "totp" ? authenticatorCodeSchema : recoveryCodeSchema,
      new FormData(formElement)
    );
    if (!validationResult.success) {
      setFieldErrors(validationResult.errors);
      focusFirstInvalidField(formElement, validationResult.errors);
      return;
    }
    setFieldErrors({});
    codeMutation.mutate(
      {
        mfaToken: stage.mfaToken,
        method: stage.method,
        code: validationResult.data.code,
      },
      {
        onSuccess: (session) => showStage({ kind: "signed-in", session }),
        onError: (error) => {
          if (
            error instanceof PlatformApiError &&
            (error.code === "AUTH_TOKEN_EXPIRED" ||
              error.code === "AUTH_TOKEN_INVALID")
          ) {
            showStage(
              { kind: "password" },
              "Signing in took too long. Enter your password again."
            );
          }
        },
      }
    );
  }

  function handleSignOut() {
    if (stage.kind !== "signed-in") return;
    signOutMutation.mutate(stage.session.accessToken, {
      // The token is dropped either way; it expires on its own soon after.
      onSettled: () => showStage({ kind: "password" }, "You have signed out."),
    });
  }

  const heading =
    stage.kind === "code"
      ? "Enter your sign-in code"
      : stage.kind === "enrolment-required"
        ? "Set up an authenticator app"
        : stage.kind === "signed-in"
          ? `Welcome, ${stage.session.user.firstName}`
          : "Sign in";

  const introduction =
    stage.kind === "code"
      ? stage.method === "totp"
        ? "Open your authenticator app and enter the 6-digit code for HealthAlyst."
        : "Enter one of the recovery codes you saved when you set up your authenticator app. Each code works once."
      : stage.kind === "enrolment-required"
        ? "Your password is correct, but this account has no authenticator app yet."
        : stage.kind === "signed-in"
          ? "You are signed in to HealthAlyst."
          : "Use the administrator email address and password from registration.";

  return (
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
                    aria-invalid={Boolean(fieldErrors.identifier) || undefined}
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
                className="gap-1.5"
                data-invalid={Boolean(fieldErrors.code)}
              >
                <FieldLabel htmlFor="sign-in-code">
                  {stage.method === "totp"
                    ? "Authenticator code"
                    : "Recovery code"}
                </FieldLabel>
                <Input
                  key={stage.method}
                  autoComplete="one-time-code"
                  autoFocus
                  id="sign-in-code"
                  name="code"
                  type="text"
                  inputMode={stage.method === "totp" ? "numeric" : "text"}
                  maxLength={
                    stage.method === "totp"
                      ? 7
                      : SIGN_IN_LIMITS.recoveryCodeMaximum
                  }
                  required
                  disabled={codeMutation.isPending}
                  aria-invalid={Boolean(fieldErrors.code) || undefined}
                  aria-describedby={
                    fieldErrors.code ? "sign-in-code-error" : undefined
                  }
                  onChange={() =>
                    setFieldErrors((currentErrors) =>
                      clearFieldError(currentErrors, "code")
                    )
                  }
                />
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
              <div className="flex flex-col items-center gap-1">
                {stage.methods.length > 1 && (
                  <ActionButton
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
                <ActionButton
                  size="small"
                  type="button"
                  variant="link"
                  disabled={codeMutation.isPending}
                  onClick={() => showStage({ kind: "password" })}
                >
                  Sign in with a different account
                </ActionButton>
              </div>
            </form>
          )}

          {stage.kind === "enrolment-required" && (
            <>
              <p className="text-sm leading-6 text-muted-foreground">
                Every HealthAlyst administrator account is protected with a code
                from an authenticator app. Authenticator set-up is not available
                in this version of HealthSchedule yet.
              </p>
              <ActionButton
                className="w-full"
                size="large"
                type="button"
                variant="outline"
                onClick={() => showStage({ kind: "password" })}
              >
                Back to sign in
              </ActionButton>
            </>
          )}

          {stage.kind === "signed-in" && (
            <>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {stage.session.user.firstName} {stage.session.user.lastName}
                </p>
                {stage.session.user.email && (
                  <p className="break-all text-sm text-muted-foreground">
                    {stage.session.user.email}
                  </p>
                )}
              </div>
              {stage.session.memberships.length > 0 ? (
                <section aria-labelledby="sign-in-organizations-heading">
                  <h3
                    id="sign-in-organizations-heading"
                    className="text-sm font-semibold"
                  >
                    Your organisations
                  </h3>
                  <ul className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border">
                    {stage.session.memberships.map((membership) => (
                      <li
                        key={membership.membershipId}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <span className="text-sm font-medium">
                          {membership.organization.name}
                        </span>
                        <Badge className="shrink-0" variant="secondary">
                          {describeStatus(membership.organization.status)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This account does not belong to an organisation yet.
                </p>
              )}
              <ActionButton
                className="w-full"
                size="large"
                type="button"
                variant="outline"
                isLoading={signOutMutation.isPending}
                loadingText="Signing out"
                onClick={handleSignOut}
              >
                Sign out
              </ActionButton>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
