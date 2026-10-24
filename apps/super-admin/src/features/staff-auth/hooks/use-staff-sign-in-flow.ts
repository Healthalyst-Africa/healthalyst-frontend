"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  startAuthenticatorSetup,
  type PasswordStepResponse,
} from "@healthalyst/platform-api/authentication-service";
import {
  confirmStaffAuthenticatorSetup,
  createStaffSession,
  verifyStaffSignInCode,
} from "~/features/staff-auth/services/staff-service";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";
import { staffSignInSchema } from "~/features/staff-auth/schemas/staff-sign-in-schema";
import type { StaffSignInStage } from "~/features/staff-auth/types/staff-sign-in";
import { APPLICATION_ROUTES } from "~/config/application-routes";
import { STAFF_SIGN_IN_HEADINGS } from "~/features/staff-auth/config/staff-sign-in";

export function useStaffSignInFlow() {
  const router = useRouter();
  const { setStaffIdentity, staffIdentity, status } = useStaffSession();
  const [stage, setStage] = useState<StaffSignInStage>({ kind: "password" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verificationCode, setVerificationCode] = useState("");
  const [hasSavedRecoveryCodes, setHasSavedRecoveryCodes] = useState(false);

  const authenticatorSetupMutation = useMutation({
    mutationFn: startAuthenticatorSetup,
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
          kind: "verification",
          methods: passwordStep.methods,
          method,
        });
        return;
      }
      setStage({ kind: "enrollment-loading" });
      authenticatorSetupMutation.mutate();
    },
  });

  const verificationMutation = useMutation({
    mutationFn: verifyStaffSignInCode,
    onSuccess: (nextStaffIdentity) => {
      setStaffIdentity(nextStaffIdentity);
      router.replace(APPLICATION_ROUTES.dashboard);
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
    if (staffIdentity) router.replace(APPLICATION_ROUTES.dashboard);
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
    if (stage.kind !== "verification") return;
    verificationMutation.mutate({
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
    verificationMutation.reset();
    authenticatorConfirmationMutation.reset();
  }

  function finishAuthenticatorEnrollment() {
    if (stage.kind !== "recovery-codes" || !hasSavedRecoveryCodes) return;
    setStaffIdentity(stage.staffIdentity);
    router.replace(APPLICATION_ROUTES.dashboard);
  }

  function clearFieldError(fieldName: "emailAddress" | "password") {
    setFieldErrors((currentErrors) => ({ ...currentErrors, [fieldName]: "" }));
  }

  function toggleVerificationMethod() {
    if (stage.kind !== "verification") return;
    setVerificationCode("");
    setStage({
      ...stage,
      method: stage.method === "totp" ? "recovery_code" : "totp",
    });
  }

  const stageHeading = STAFF_SIGN_IN_HEADINGS[stage.kind];
  return {
    stage,
    status,
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
    stageTitle: stageHeading.title,
    stageDescription: stageHeading.description,
  };
}
