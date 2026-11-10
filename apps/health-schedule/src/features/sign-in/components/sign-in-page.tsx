"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { SignInForm } from "@healthalyst/ui/components/sign-in-form";
import { SplitPanelLayout } from "@healthalyst/ui/components/split-panel-layout";
import HealthAlystBrand from "~/components/ui/healthalyst-brand";
import { getOrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";
import {
  SIGN_IN_FORM_IDENTIFIER,
  SIGN_IN_LIMITS,
} from "~/features/sign-in/config/sign-in";
import { useSignInWorkflow } from "~/features/sign-in/hooks/use-sign-in-workflow";

const LINK_CLASS_NAME =
  "font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * A link into the organisation hub. It opens a new browser window, so an
 * installed HealthSchedule stays on its sign-in page.
 */
function HubLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener">
      {children}
      <span className="sr-only"> (opens in a new window)</span>
    </a>
  );
}

function HealthScheduleShowcase() {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <Image
          alt=""
          className="object-cover"
          fill
          preload
          sizes="50vw"
          src="/images/module-hospital.webp"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,hsl(var(--primary)/0.94),hsl(var(--primary)/0.78)_40%,hsl(var(--primary)/0.5))]"
      />
      <div className="flex size-full flex-col items-start justify-between gap-10 text-left">
        <div className="rounded-lg bg-card p-1">
          <HealthAlystBrand />
        </div>
        <div className="flex flex-col gap-5">
          <p className="max-w-[18ch] text-balance font-serif text-[clamp(2rem,1rem+2.4vw,3.5rem)] font-normal leading-[1.08] tracking-[-0.01em]">
            HealthSchedule
          </p>
          <p className="max-w-[44ch] text-base leading-[1.6] opacity-90 xl:text-lg">
            Patient scheduling and clinical operations for hospitals and
            clinics.
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * HealthSchedule's signed-out page. People sign in here, so an installed app
 * never has to leave to sign in; the session is shared with the organisation
 * hub. Registering and setting up an account stay in the hub, in the browser.
 */
export function SignInPage() {
  const organizationAppLinks = getOrganizationAppLinks();
  const {
    stage,
    fieldErrors,
    stageNotice,
    headingReference,
    error,
    isSubmitting,
    showStage,
    handlePasswordSubmit,
    handleCodeSubmit,
    clearFieldError,
    switchCodeMethod,
  } = useSignInWorkflow();

  const errorDetails =
    error instanceof PlatformApiError &&
    error.code === "EMAIL_NOT_VERIFIED" &&
    organizationAppLinks ? (
      <p className="text-sm text-muted-foreground">
        Confirm your email address in{" "}
        <HubLink className={LINK_CLASS_NAME} href={organizationAppLinks.signIn}>
          HealthAlyst
        </HubLink>
        , then sign in here.
      </p>
    ) : undefined;

  return (
    <SplitPanelLayout
      className="bg-card"
      title="Sign in to HealthSchedule"
      showcaseClassName="bg-primary text-primary-foreground"
      showcaseLabel="About HealthSchedule"
      compactHeader={<HealthAlystBrand />}
      showcase={<HealthScheduleShowcase />}
      footer={
        stage.kind === "password" && organizationAppLinks ? (
          <p className="text-center text-sm text-muted-foreground">
            New to HealthAlyst?{" "}
            <HubLink
              className={LINK_CLASS_NAME}
              href={organizationAppLinks.registration}
            >
              Register your organisation
            </HubLink>
          </p>
        ) : stage.kind === "code" ? (
          <div className="flex justify-center">
            <ActionButton
              className="h-auto px-0 text-sm font-semibold text-primary underline underline-offset-4 hover:no-underline"
              size="unstyled"
              type="button"
              variant="link"
              disabled={isSubmitting}
              onClick={() => showStage({ kind: "password" })}
            >
              Sign in with a different account
            </ActionButton>
          </div>
        ) : undefined
      }
    >
      {stage.kind === "enrolment-required" ? (
        <StateNotice
          tone="information"
          title="Set up your authenticator app first"
          action={
            <div className="flex flex-wrap gap-3">
              {organizationAppLinks && (
                <HubLink
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  href={organizationAppLinks.signIn}
                >
                  Set it up in HealthAlyst
                </HubLink>
              )}
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => showStage({ kind: "password" })}
              >
                Back to sign in
              </ActionButton>
            </div>
          }
        >
          Your account needs an authenticator app before it can sign in. Set it
          up in HealthAlyst in your browser, then come back and sign in here.
        </StateNotice>
      ) : (
        <SignInForm
          identifier={SIGN_IN_FORM_IDENTIFIER}
          stage={
            stage.kind === "code"
              ? {
                  kind: "code",
                  method: stage.method,
                  canSwitchMethod: stage.methods.length > 1,
                }
              : { kind: "password" }
          }
          heading={
            stage.kind === "code"
              ? "Enter your sign-in code"
              : "Sign in to HealthSchedule"
          }
          introduction={
            stage.kind === "code"
              ? stage.method === "totp"
                ? "Open your authenticator app and enter the 6-digit code for HealthAlyst."
                : "Enter one of the recovery codes you saved when you set up your authenticator app. Each code works once."
              : "Use your HealthAlyst work email address and password. One sign-in works for every HealthAlyst product."
          }
          headingReference={headingReference}
          notice={stageNotice}
          fieldErrors={fieldErrors}
          error={
            error ? { message: error.message, details: errorDetails } : null
          }
          isSubmitting={isSubmitting}
          limits={SIGN_IN_LIMITS}
          forgotPasswordLink={
            organizationAppLinks ? (
              <HubLink href={organizationAppLinks.forgotPassword}>
                Forgot password?
              </HubLink>
            ) : null
          }
          onPasswordSubmit={handlePasswordSubmit}
          onCodeSubmit={handleCodeSubmit}
          onFieldChange={clearFieldError}
          onSwitchMethod={switchCodeMethod}
        />
      )}
    </SplitPanelLayout>
  );
}
