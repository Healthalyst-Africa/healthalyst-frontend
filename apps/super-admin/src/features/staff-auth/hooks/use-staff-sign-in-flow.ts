"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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
import {
  staffAuthenticatorCodeSchema,
  staffRecoveryCodeSchema,
  staffSignInSchema,
} from "~/features/staff-auth/schemas/staff-sign-in-schema";
import type { StaffSignInStage } from "~/features/staff-auth/types/staff-sign-in";
import { APPLICATION_ROUTES } from "~/config/application-routes";
import { STAFF_SIGN_IN_HEADINGS } from "~/features/staff-auth/config/staff-sign-in";

export function useStaffSignInFlow() {
  const router = useRouter();
  const { setStaffIdentity, staffIdentity, status, sessionError } =
    useStaffSession();
  const [stage, setStage] = useState<StaffSignInStage>({ kind: "password" });
  const headingReference = useRef<HTMLHeadingElement>(null);
  const hasChangedStageReference = useRef(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verificationCode, setVerificationCode] = useState("");
  const [hasSavedRecoveryCodes, setHasSavedRecoveryCodes] = useState(false);

  const authenticatorSetupMutation = useMutation({
    mutationFn: (enrolmentToken: string) =>
      startAuthenticatorSetup(enrolmentToken),
    onSuccess: (setup, enrolmentToken) =>
      setStage({ kind: "enrollment", setup, enrolmentToken }),
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
          mfaToken: passwordStep.mfaToken,
          methods: passwordStep.methods,
          method,
        });
        return;
      }
      setStage({
        kind: "enrollment-loading",
        enrolmentToken: passwordStep.enrolmentToken,
      });
      authenticatorSetupMutation.mutate(passwordStep.enrolmentToken);
    },
  });

  const verificationMutation = useMutation({
    mutationFn: verifyStaffSignInCode,
    onSuccess: (nextStaffIdentity) => {
      returnToPasswordStep();
      setStaffIdentity(nextStaffIdentity);
      router.replace(APPLICATION_ROUTES.dashboard);
    },
  });

  const authenticatorConfirmationMutation = useMutation({
    mutationFn: confirmStaffAuthenticatorSetup,
    onSuccess: ({ staffIdentity: nextStaffIdentity, recoveryCodes }) => {
      passwordMutation.reset();
      authenticatorSetupMutation.reset();
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

  useEffect(() => {
    if (!hasChangedStageReference.current) {
      hasChangedStageReference.current = true;
      return;
    }
    headingReference.current?.focus();
  }, [stage.kind]);

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
    const verificationSchema =
      stage.method === "totp"
        ? staffAuthenticatorCodeSchema
        : staffRecoveryCodeSchema;
    const validationResult = verificationSchema.safeParse({
      code: verificationCode,
    });
    if (!validationResult.success) {
      setFieldErrors({
        code:
          validationResult.error.issues[0]?.message ?? "Enter a valid code.",
      });
      formEvent.currentTarget
        .querySelector<HTMLInputElement>("#staff-authenticator-code")
        ?.focus();
      return;
    }
    setFieldErrors({});
    verificationMutation.mutate({
      mfaToken: stage.mfaToken,
      method: stage.method,
      code: validationResult.data.code,
    });
  }

  function handleVerificationCodeChange(codeValue: string) {
    setVerificationCode(codeValue);
    setFieldErrors((currentErrors) => ({ ...currentErrors, code: "" }));
    verificationMutation.reset();
  }

  function handleEnrollmentSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (stage.kind !== "enrollment") return;
    authenticatorConfirmationMutation.mutate({
      enrolmentToken: stage.enrolmentToken,
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
    returnToPasswordStep();
    router.replace(APPLICATION_ROUTES.dashboard);
  }

  function clearFieldError(fieldName: "emailAddress" | "password") {
    setFieldErrors((currentErrors) => ({ ...currentErrors, [fieldName]: "" }));
  }

  function toggleVerificationMethod() {
    if (stage.kind !== "verification") return;
    setVerificationCode("");
    setFieldErrors({});
    verificationMutation.reset();
    setStage({
      ...stage,
      method: stage.method === "totp" ? "recovery_code" : "totp",
    });
  }

  const stageHeading = STAFF_SIGN_IN_HEADINGS[stage.kind];
  return {
    stage,
    headingReference,
    status,
    sessionError,
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
    handleVerificationCodeChange,
    handleEnrollmentSubmit,
    returnToPasswordStep,
    finishAuthenticatorEnrollment,
    stageTitle: stageHeading.title,
    stageDescription: stageHeading.description,
  };
}
