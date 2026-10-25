"use client";

import { useRef, useState, type FormEvent } from "react";
import type { AuthenticatorSetup } from "@healthalyst/platform-api/authentication-service";
import { authenticatorCodeSchema } from "~/features/authentication/schemas/sign-in-schema";
import {
  copyText,
  groupSetupKey,
} from "~/features/authentication/utilities/authenticator-enrolment";
import type { useAuthenticatorConfirmationMutation } from "~/features/authentication/hooks/use-authenticator-enrolment";
export function useAuthenticatorConfirmation(
  setup: AuthenticatorSetup,
  confirmationMutation: ReturnType<typeof useAuthenticatorConfirmationMutation>
) {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [keyCopyStatus, setKeyCopyStatus] = useState("");
  const codeInputReference = useRef<HTMLInputElement>(null);
  const isConfirmationInFlightReference = useRef(false);
  const setupKeyGroups = groupSetupKey(setup.secret);

  function confirmCode(enteredCode: string) {
    if (
      isConfirmationInFlightReference.current ||
      confirmationMutation.isPending
    ) {
      return;
    }

    const validationResult = authenticatorCodeSchema.safeParse({
      code: enteredCode,
    });
    if (!validationResult.success) {
      setCodeError(
        validationResult.error.issues[0]?.message ??
          "Enter the 6-digit code from your authenticator app."
      );
      codeInputReference.current?.focus();
      return;
    }
    setCodeError(null);
    isConfirmationInFlightReference.current = true;
    confirmationMutation.mutate(
      {
        factorId: setup.factorId,
        code: validationResult.data.code,
      },
      {
        onError: () => {
          // A wrong code is retyped from the start. The input is still
          // disabled while the request settles, so focus after it re-renders.
          setCode("");
          window.requestAnimationFrame(() =>
            codeInputReference.current?.focus()
          );
        },
        onSettled: () => {
          isConfirmationInFlightReference.current = false;
        },
      }
    );
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    confirmCode(code);
  }

  async function copySetupKey() {
    setKeyCopyStatus(
      (await copyText(setup.secret))
        ? "Setup key copied."
        : "Copying is not available here. Type the setup key in."
    );
  }
  function handleCodeChange(enteredCode: string) {
    setCode(enteredCode);
    setCodeError(null);
    if (confirmationMutation.error) confirmationMutation.reset();
  }
  return {
    code,
    codeError,
    keyCopyStatus,
    codeInputReference,
    setupKeyGroups,
    confirmCode,
    handleSubmit,
    copySetupKey,
    handleCodeChange,
  };
}
