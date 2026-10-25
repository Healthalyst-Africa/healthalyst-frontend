"use client";

import { useState, type FormEvent } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { TextField } from "@healthalyst/ui/components/text-field";
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
    <ContentPanel elevation="flat" spacing="compact">
      <section
        aria-labelledby="phone-verification-heading"
        className="flex flex-col gap-6"
      >
        <h2
          id="phone-verification-heading"
          className="font-semibold leading-tight"
        >
          Phone number verification
        </h2>
        <div className="flex flex-col gap-4">
          {(!emailIsVerified || !authenticatorIsEnrolled) && (
            <NoticeBanner
              tone="warning"
              title="Also finish securing your account"
            >
              {!emailIsVerified && !authenticatorIsEnrolled ? (
                <ul className="list-inside list-disc">
                  <li>
                    Open the confirmation link sent to your administrator email.
                  </li>
                  <li>
                    Finish authenticator setup during sign-in, then return here.
                  </li>
                </ul>
              ) : emailIsVerified ? (
                "Finish authenticator setup during sign-in, then return here."
              ) : (
                "Open the confirmation link sent to your administrator email, then return here."
              )}
            </NoticeBanner>
          )}
          {isPhoneVerified ? (
            <NoticeBanner
              tone="success"
              size="prominent"
              illustration={<DocumentsCompleteIllustration />}
              title="Your phone number is verified"
            />
          ) : (
            <div className="flex flex-col gap-4">
              {!sentToPhoneNumber ? (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={handleSendCode}
                  noValidate
                >
                  <TextField
                    autoComplete="tel"
                    id="administrator-phone-number"
                    label="Phone number"
                    inputMode="tel"
                    required
                    type="tel"
                    value={phoneNumber}
                    error={phoneError}
                    onChange={(changeEvent) =>
                      handlePhoneChange(changeEvent.currentTarget.value)
                    }
                  />
                  {sendCodeMutation.error && (
                    <FormMessage tone="error">
                      {sendCodeMutation.error.message}
                    </FormMessage>
                  )}
                  <ActionButton
                    className="w-full sm:w-auto sm:self-start"
                    type="submit"
                    disabled={!phoneNumber.trim()}
                    isLoading={sendCodeMutation.isPending}
                    loadingText="Sending verification code"
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
                  <TextField
                    autoComplete="one-time-code"
                    id="administrator-phone-verification-code"
                    label="Verification code"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={verificationCode}
                    error={codeError}
                    onChange={(changeEvent) => {
                      setVerificationCode(
                        changeEvent.currentTarget.value.replace(/\D/g, "")
                      );
                      setCodeError("");
                    }}
                  />
                  {sendCodeMutation.error && (
                    <FormMessage tone="error">
                      {sendCodeMutation.error.message}
                    </FormMessage>
                  )}
                  {verifyPhoneMutation.error && (
                    <FormMessage tone="error">
                      {verifyPhoneMutation.error.message}
                    </FormMessage>
                  )}
                  <div className="flex flex-col gap-3">
                    <ActionButton
                      className="min-h-11 w-full sm:w-auto sm:self-start"
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
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
        <a
          href="#onboarding-content"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={(clickEvent) => {
            clickEvent.preventDefault();
            onBack();
          }}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4 shrink-0" />
          Back to organisation details
        </a>
        <a
          href="#onboarding-content"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-normal text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={(clickEvent) => {
            clickEvent.preventDefault();
            onContinue();
          }}
        >
          Continue to supporting documents
          <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
        </a>
      </div>
    </ContentPanel>
  );
}
