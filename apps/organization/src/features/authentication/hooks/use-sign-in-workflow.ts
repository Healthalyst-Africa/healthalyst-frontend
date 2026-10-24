"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import {
  clearFieldError,
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import {
  authenticatorCodeSchema,
  passwordStepSchema,
  recoveryCodeSchema,
} from "~/features/authentication/schemas/sign-in-schema";
import type { SignInStage } from "~/features/authentication/types/sign-in";
import {
  usePasswordSignInMutation,
  useSignInCodeMutation,
} from "~/features/authentication/hooks/use-sign-in";

export function useSignInWorkflow() {
  const router = useRouter();
  const { platformSession, isRestoring, setPlatformSession } =
    usePlatformSession();
  const [stage, setStage] = useState<SignInStage>({ kind: "password" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [stageNotice, setStageNotice] = useState<string | null>(null);
  const headingReference = useRef<HTMLHeadingElement>(null);
  const hasChangedStageReference = useRef(false);
  const passwordMutation = usePasswordSignInMutation();
  const codeMutation = useSignInCodeMutation();

  useEffect(() => {
    if (platformSession) {
      router.replace(ORGANIZATION_ROUTES.application);
    }
  }, [platformSession, router]);

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

  function completeSignIn(session: PlatformSession) {
    setPlatformSession(session);
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
        method: stage.method,
        code: validationResult.data.code,
      },
      {
        onSuccess: completeSignIn,
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

  function handleCodeChange() {
    setFieldErrors((currentErrors) => clearFieldError(currentErrors, "code"));
    if (codeMutation.error) {
      codeMutation.reset();
    }
  }

  return {
    stage,
    fieldErrors,
    setFieldErrors,
    stageNotice,
    headingReference,
    passwordMutation,
    codeMutation,
    platformSession,
    isRestoring,
    showStage,
    completeSignIn,
    handlePasswordSubmit,
    handleCodeSubmit,
    handleCodeChange,
  };
}
