"use client";

import { useState, type FormEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@healthalyst/ui/components/alert";
import { Card, CardContent } from "@healthalyst/ui/components/card";
import {
  Field,
  FieldError,
  FieldLegend,
  FieldSet,
  FieldLabel,
} from "@healthalyst/ui/components/field";
import { Input } from "@healthalyst/ui/components/input";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import {
  usePhoneVerificationCodeMutation,
  usePhoneVerificationMutation,
} from "~/features/authentication/hooks/use-platform-authentication";
import { INTERNATIONAL_PHONE_PATTERN } from "~/shared/organization/config/organization-validation";
import { toInternationalPhoneNumber } from "~/shared/organization/utilities/international-phone-number";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";

export function OrganizationAccountVerificationStep({
  application,
  session,
  onBack,
  onContinue,
  onPhoneVerified,
}: {
  application: OrganizationApplication;
  session: PlatformSession;
  onBack: () => void;
  onContinue: () => void;
  onPhoneVerified: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState(session.user.phone ?? "");
  const [sentToPhoneNumber, setSentToPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [codeError, setCodeError] = useState("");
  const sendCodeMutation = usePhoneVerificationCodeMutation();
  const verifyPhoneMutation = usePhoneVerificationMutation();
  const isPhoneVerified =
    application.checklist.phoneVerified ||
    Boolean(session.user.phoneVerifiedAt) ||
    verifyPhoneMutation.isSuccess;
  const normalizedPhoneNumber = toInternationalPhoneNumber(phoneNumber);
  const emailIsVerified =
    application.checklist.emailVerified ||
    Boolean(session.user.emailVerifiedAt);
  const authenticatorIsEnrolled =
    application.checklist.mfaEnrolled || session.user.mfa.totp;

  function handleSendCode(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!INTERNATIONAL_PHONE_PATTERN.test(normalizedPhoneNumber)) {
      setPhoneError(
        "Enter a valid mobile number, for example 08031234567 or +2348031234567."
      );
      return;
    }
    setPhoneError("");
    setCodeError("");
    sendCodeMutation.mutate(
      { phoneNumber: normalizedPhoneNumber },
      {
        onSuccess: () => {
          setSentToPhoneNumber(normalizedPhoneNumber);
          setVerificationCode("");
        },
      }
    );
  }

  function handleVerifyPhone(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) {
      setCodeError("Enter the 6-digit code sent to your phone.");
      return;
    }
    setCodeError("");
    verifyPhoneMutation.mutate(
      { code: verificationCode },
      { onSuccess: onPhoneVerified }
    );
  }

  function handlePhoneChange(phoneValue: string) {
    setPhoneNumber(phoneValue);
    setPhoneError("");
    sendCodeMutation.reset();
  }

  function handleChangePhoneNumber() {
    setSentToPhoneNumber("");
    setVerificationCode("");
    setCodeError("");
    sendCodeMutation.reset();
    verifyPhoneMutation.reset();
  }

  return (
    <Card className="shadow-none">
      <CardContent className="flex flex-col gap-5 p-5 sm:p-8">
        <FieldSet className="gap-0">
          <FieldLegend
            className="mb-0 font-sans font-semibold leading-tight"
            variant="legend"
          >
            Phone number verification
          </FieldLegend>
          <div className="mt-6">
            {!emailIsVerified || !authenticatorIsEnrolled ? (
              <Alert variant="destructive">
                <AlertTitle>Finish securing your account first</AlertTitle>
                <AlertDescription>
                  {!emailIsVerified && !authenticatorIsEnrolled ? (
                    <ul className="list-inside list-disc">
                      <li>
                        Open the confirmation link sent to your administrator
                        email.
                      </li>
                      <li>
                        Finish authenticator setup during sign-in, then return
                        here.
                      </li>
                    </ul>
                  ) : emailIsVerified ? (
                    "Finish authenticator setup during sign-in, then return here."
                  ) : (
                    "Open the confirmation link sent to your administrator email, then return here."
                  )}
                </AlertDescription>
              </Alert>
            ) : isPhoneVerified ? (
              <Alert>
                <AlertTitle>Account verification is complete</AlertTitle>
              </Alert>
            ) : (
              <div className="flex flex-col gap-4">
                {!sentToPhoneNumber ? (
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={handleSendCode}
                    noValidate
                  >
                    <Field data-invalid={Boolean(phoneError)}>
                      <FieldLabel htmlFor="administrator-phone-number">
                        Phone number
                      </FieldLabel>
                      <Input
                        autoComplete="tel"
                        id="administrator-phone-number"
                        inputMode="tel"
                        required
                        type="tel"
                        value={phoneNumber}
                        aria-invalid={Boolean(phoneError) || undefined}
                        aria-describedby={
                          phoneError
                            ? "administrator-phone-number-error"
                            : undefined
                        }
                        onChange={(changeEvent) =>
                          handlePhoneChange(changeEvent.currentTarget.value)
                        }
                      />
                      {phoneError && (
                        <FieldError id="administrator-phone-number-error">
                          {phoneError}
                        </FieldError>
                      )}
                    </Field>
                    {sendCodeMutation.error && (
                      <p className="text-sm text-destructive" role="alert">
                        {sendCodeMutation.error.message}
                      </p>
                    )}
                    <ActionButton
                      type="submit"
                      isLoading={sendCodeMutation.isPending}
                      loadingText="Sending verification code"
                      disabled={!phoneNumber.trim()}
                    >
                      Send verification code
                    </ActionButton>
                  </form>
                ) : (
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={handleVerifyPhone}
                    noValidate
                  >
                    <p className="text-sm leading-6 text-muted-foreground">
                      Enter the 6-digit code sent to {sentToPhoneNumber}.
                    </p>
                    <Field data-invalid={Boolean(codeError)}>
                      <FieldLabel htmlFor="administrator-phone-verification-code">
                        Verification code
                      </FieldLabel>
                      <Input
                        autoComplete="one-time-code"
                        id="administrator-phone-verification-code"
                        inputMode="numeric"
                        maxLength={6}
                        pattern="[0-9]{6}"
                        required
                        value={verificationCode}
                        aria-invalid={Boolean(codeError) || undefined}
                        aria-describedby={
                          codeError
                            ? "administrator-phone-verification-code-error"
                            : undefined
                        }
                        onChange={(changeEvent) => {
                          setVerificationCode(
                            changeEvent.currentTarget.value.replace(/\D/g, "")
                          );
                          setCodeError("");
                        }}
                      />
                      {codeError && (
                        <FieldError id="administrator-phone-verification-code-error">
                          {codeError}
                        </FieldError>
                      )}
                    </Field>
                    {sendCodeMutation.error && (
                      <p className="text-sm text-destructive" role="alert">
                        {sendCodeMutation.error.message}
                      </p>
                    )}
                    {verifyPhoneMutation.error && (
                      <p className="text-sm text-destructive" role="alert">
                        {verifyPhoneMutation.error.message}
                      </p>
                    )}
                    <div className="flex flex-col gap-3">
                      <ActionButton
                        className="min-h-11 w-full"
                        type="submit"
                        isLoading={verifyPhoneMutation.isPending}
                        loadingText="Verifying phone number"
                        disabled={verificationCode.length !== 6}
                      >
                        Verify phone number
                      </ActionButton>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <ActionButton
                          className="min-h-11 w-full justify-start px-0 sm:w-auto"
                          size="small"
                          type="button"
                          variant="link"
                          isLoading={sendCodeMutation.isPending}
                          loadingText="Sending another code"
                          onClick={() =>
                            sendCodeMutation.mutate({
                              phoneNumber: sentToPhoneNumber,
                            })
                          }
                        >
                          Send another code
                        </ActionButton>
                        <ActionButton
                          className="min-h-11 w-full justify-start px-0 sm:w-auto"
                          size="small"
                          type="button"
                          variant="link"
                          onClick={handleChangePhoneNumber}
                        >
                          Change number
                        </ActionButton>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </FieldSet>

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
          <a
            href="#onboarding-content"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onBack}
          >
            <ChevronLeftIcon aria-hidden="true" className="size-4 shrink-0" />
            Back to organisation details
          </a>
          <a
            href="#onboarding-content"
            aria-disabled={
              !emailIsVerified || !authenticatorIsEnrolled || !isPhoneVerified
            }
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-disabled:text-muted-foreground"
            onClick={(clickEvent) => {
              if (
                !emailIsVerified ||
                !authenticatorIsEnrolled ||
                !isPhoneVerified
              ) {
                clickEvent.preventDefault();
                return;
              }

              onContinue();
            }}
          >
            Continue to supporting documents
            <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
