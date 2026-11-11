"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  signInWithPassword,
  verifySignInCode,
  type SignInMethod,
} from "@healthalyst/platform-api/authentication-service";
import {
  EXPIRED_CHALLENGE_ERROR_CODES,
  SIGN_IN_FORM_IDENTIFIER,
} from "~/features/sign-in/config/sign-in";
import {
  authenticatorCodeSchema,
  passwordStepSchema,
  recoveryCodeSchema,
} from "~/features/sign-in/schemas/sign-in-schema";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";

export type SignInStage =
  | { kind: "password" }
  | {
      kind: "code";
      mfaToken: string;
      methods: readonly SignInMethod[];
      method: SignInMethod;
    }
  /** The account has no authenticator yet; that is set up in the hub. */
  | { kind: "enrolment-required" };

type ParsedForm<Output> =
  | { success: true; data: Output }
  | { success: false; errors: Record<string, string> };

function parseForm<Schema extends z.ZodType>(
  schema: Schema,
  formElement: HTMLFormElement
): ParsedForm<z.output<Schema>> {
  const result = schema.safeParse(
    Object.fromEntries(new FormData(formElement))
  );
  if (result.success) return { success: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const fieldName = String(issue.path[0]);
    errors[fieldName] ??= issue.message;
  }
  return { success: false, errors };
}

function focusFirstInvalidField(
  formElement: HTMLFormElement,
  errors: Record<string, string>
) {
  const firstFieldName = Object.keys(errors)[0];
  if (!firstFieldName) return;
  formElement
    .querySelector<HTMLElement>(`#${SIGN_IN_FORM_IDENTIFIER}-${firstFieldName}`)
    ?.focus();
}

/**
 * Signs a person in to HealthSchedule itself: work email and password, then
 * an authenticator or recovery code. The session lands on the same HealthAlyst
 * account host as the hub's, so the hub is signed in too.
 */
export function useSignInWorkflow() {
  const { setPlatformSession } = usePlatformSession();
  const [stage, setStage] = useState<SignInStage>({ kind: "password" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stageNotice, setStageNotice] = useState<string | null>(null);
  const headingReference = useRef<HTMLHeadingElement>(null);
  const hasChangedStageReference = useRef(false);
  const passwordMutation = useMutation({ mutationFn: signInWithPassword });
  const codeMutation = useMutation({ mutationFn: verifySignInCode });

  useEffect(() => {
    // Move focus to the new heading when the step changes, not on load.
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
    const result = parseForm(passwordStepSchema, formElement);
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    setStageNotice(null);
    passwordMutation.mutate(result.data, {
      onSuccess: (passwordStep) => {
        if (passwordStep.status === "MFA_ENROLMENT_REQUIRED") {
          showStage({ kind: "enrolment-required" });
          return;
        }
        showStage({
          kind: "code",
          mfaToken: passwordStep.mfaToken,
          methods: passwordStep.methods,
          method: passwordStep.methods.includes("totp")
            ? "totp"
            : (passwordStep.methods[0] ?? "totp"),
        });
      },
    });
  }

  function handleCodeSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (stage.kind !== "code") return;
    const formElement = formEvent.currentTarget;
    const result = parseForm(
      stage.method === "totp" ? authenticatorCodeSchema : recoveryCodeSchema,
      formElement
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    codeMutation.mutate(
      {
        mfaToken: stage.mfaToken,
        method: stage.method,
        code: result.data.code,
      },
      {
        onSuccess: setPlatformSession,
        onError: (error) => {
          if (
            error instanceof PlatformApiError &&
            error.code !== null &&
            EXPIRED_CHALLENGE_ERROR_CODES.includes(error.code)
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

  function clearFieldError(fieldName: string) {
    setFieldErrors((currentErrors) => {
      if (!(fieldName in currentErrors)) return currentErrors;
      const remainingErrors = { ...currentErrors };
      delete remainingErrors[fieldName];
      return remainingErrors;
    });
    if (fieldName === "code" && codeMutation.error) codeMutation.reset();
  }

  function switchCodeMethod() {
    if (stage.kind !== "code") return;
    showStage({
      ...stage,
      method: stage.method === "totp" ? "recovery_code" : "totp",
    });
  }

  return {
    stage,
    fieldErrors,
    stageNotice,
    headingReference,
    error: stage.kind === "code" ? codeMutation.error : passwordMutation.error,
    isSubmitting:
      stage.kind === "code"
        ? codeMutation.isPending
        : passwordMutation.isPending,
    showStage,
    handlePasswordSubmit,
    handleCodeSubmit,
    clearFieldError,
    switchCodeMethod,
  };
}
