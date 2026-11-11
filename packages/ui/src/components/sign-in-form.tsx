"use client";

import type { FormEvent, ReactNode, Ref } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { OneTimeCodeField } from "@healthalyst/ui/components/one-time-code-field";
import { TextField } from "@healthalyst/ui/components/text-field";

type SignInFormStage =
  | { kind: "password" }
  | {
      kind: "code";
      method: "totp" | "recovery_code";
      /** The account has both an authenticator and recovery codes. */
      canSwitchMethod: boolean;
    };

type SignInFormProperties = {
  /** Distinguishes several forms on one page; prefixes every field id. */
  identifier: string;
  stage: SignInFormStage;
  heading: string;
  introduction: string;
  /** Lets the app move focus to the heading when the step changes. */
  headingReference?: Ref<HTMLHeadingElement>;
  /** Status shown above the form, such as "Signing in took too long". */
  notice?: string | null;
  fieldErrors: Readonly<Record<string, string>>;
  /** The request's failure; `details` can offer a way to recover. */
  error?: { message: string; details?: ReactNode } | null;
  isSubmitting: boolean;
  limits: {
    identifierMaximum: number;
    passwordMaximum: number;
    recoveryCodeMaximum: number;
  };
  /** A link the app supplies, such as one into its password recovery. */
  forgotPasswordLink: ReactNode;
  onPasswordSubmit: (formEvent: FormEvent<HTMLFormElement>) => void;
  onCodeSubmit: (formEvent: FormEvent<HTMLFormElement>) => void;
  /** Clears a field's error as the person edits it. */
  onFieldChange: (fieldName: "identifier" | "password" | "code") => void;
  onSwitchMethod: () => void;
};

/**
 * The two sign-in steps every HealthAlyst app shares: work email and password,
 * then an authenticator or recovery code. The app owns the wording,
 * validation and requests; this only presents them.
 */
export function SignInForm({
  identifier,
  stage,
  heading,
  introduction,
  headingReference,
  notice,
  fieldErrors,
  error,
  isSubmitting,
  limits,
  forgotPasswordLink,
  onPasswordSubmit,
  onCodeSubmit,
  onFieldChange,
  onSwitchMethod,
}: SignInFormProperties) {
  const errorMessage = error ? (
    <FormMessage tone="error" details={error.details}>
      {error.message}
    </FormMessage>
  ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2
          ref={headingReference}
          className="font-serif text-title font-normal outline-none"
          tabIndex={-1}
        >
          {heading}
        </h2>
        <p className="max-w-sm text-lede text-muted-foreground">
          {introduction}
        </p>
      </div>

      <ContentPanel frame="wide-screens">
        {notice && <FormMessage tone="status">{notice}</FormMessage>}

        {stage.kind === "password" && (
          <form
            className="flex flex-col gap-5"
            onSubmit={onPasswordSubmit}
            noValidate
          >
            <TextField
              autoComplete="username"
              id={`${identifier}-identifier`}
              label="Work email address"
              name="identifier"
              type="email"
              maxLength={limits.identifierMaximum}
              required
              disabled={isSubmitting}
              error={fieldErrors.identifier}
              onChange={() => onFieldChange("identifier")}
            />
            <TextField
              autoComplete="current-password"
              id={`${identifier}-password`}
              label="Password"
              name="password"
              type="password"
              maxLength={limits.passwordMaximum}
              required
              disabled={isSubmitting}
              error={fieldErrors.password}
              onChange={() => onFieldChange("password")}
            />
            <p className="-mt-3 self-end text-sm [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
              {forgotPasswordLink}
            </p>
            {errorMessage}
            <ActionButton
              className="w-full"
              size="large"
              type="submit"
              isLoading={isSubmitting}
              loadingText="Signing in"
            >
              Sign in
            </ActionButton>
          </form>
        )}

        {stage.kind === "code" && (
          <form
            className="flex flex-col gap-5"
            onSubmit={onCodeSubmit}
            noValidate
          >
            {stage.method === "totp" ? (
              <OneTimeCodeField
                autoFocus
                id={`${identifier}-code`}
                label="Authenticator code"
                name="code"
                required
                disabled={isSubmitting}
                error={fieldErrors.code}
                onChange={() => onFieldChange("code")}
              />
            ) : (
              <TextField
                autoComplete="one-time-code"
                autoFocus
                id={`${identifier}-code`}
                label="Recovery code"
                name="code"
                maxLength={limits.recoveryCodeMaximum}
                required
                disabled={isSubmitting}
                error={fieldErrors.code}
                onChange={() => onFieldChange("code")}
              />
            )}
            {errorMessage}
            <ActionButton
              className="w-full"
              size="large"
              type="submit"
              isLoading={isSubmitting}
              loadingText="Checking the code"
            >
              Continue
            </ActionButton>
            {stage.canSwitchMethod && (
              <ActionButton
                className="self-center font-normal"
                size="small"
                type="button"
                variant="link"
                disabled={isSubmitting}
                onClick={onSwitchMethod}
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
  );
}

export type { SignInFormProperties, SignInFormStage };
