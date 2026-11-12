"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { TextField } from "@healthalyst/ui/components/text-field";
import OrganizationCenteredLayout from "~/components/ui/organization-centered-layout";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";
import { usePlatformContextSwitchMutation } from "~/features/authentication/hooks/use-platform-authentication";
import { INVITATION_GONE_STATUS } from "~/features/invitation-acceptance/config/invitation-acceptance";
import {
  useInvitationAcceptanceMutation,
  useInvitationPreviewQuery,
} from "~/features/invitation-acceptance/hooks/use-invitation-acceptance";
import {
  invitationPasswordFormSchema,
  type InvitationPreview,
} from "~/features/invitation-acceptance/schemas/invitation-acceptance-schemas";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import {
  focusFirstInvalidField,
  parseFormData,
} from "~/shared/forms/form-validation";
import { readOneTimeTokenFromAddress } from "~/shared/security/read-one-time-token-from-address";

const PRIMARY_LINK_CLASS_NAME =
  "inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const EXPIRY_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

function InvitationSummary({ preview }: { preview: InvitationPreview }) {
  return (
    <SummaryDetailList
      details={[
        { label: "Organisation", value: preview.organization.name },
        { label: "Invited by", value: preview.invitedBy },
        { label: "Your roles", value: preview.roles.join(", ") },
        {
          label: "Link expires",
          value: EXPIRY_FORMATTER.format(new Date(preview.expiresAt)),
        },
      ]}
    />
  );
}

/** Join an organisation from an emailed invitation link. */
export function AcceptInvitationPage() {
  const router = useRouter();
  const { platformSession, isRestoring, restoreSession } = usePlatformSession();
  const [invitationToken, setInvitationToken] = useState<
    string | null | undefined
  >(undefined);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasReadTokenReference = useRef(false);
  const headingReference = useRef<HTMLHeadingElement>(null);
  const previewQuery = useInvitationPreviewQuery(invitationToken ?? null);
  const acceptanceMutation = useInvitationAcceptanceMutation(
    invitationToken ?? null
  );
  const contextMutation = usePlatformContextSwitchMutation();

  useEffect(() => {
    // Read once: the token is removed from the address bar as it is read.
    if (hasReadTokenReference.current) return;
    hasReadTokenReference.current = true;
    setInvitationToken(readOneTimeTokenFromAddress() || null);
  }, []);

  useEffect(() => {
    if (acceptanceMutation.isSuccess) headingReference.current?.focus();
  }, [acceptanceMutation.isSuccess]);

  const preview = previewQuery.data;
  const acceptance = acceptanceMutation.data;
  const isGone =
    previewQuery.error instanceof PlatformApiError &&
    previewQuery.error.status === INVITATION_GONE_STATUS;

  function openOrganization(organizationId: string) {
    contextMutation.mutate(
      { context: { organizationId } },
      {
        onSuccess: async () => {
          await restoreSession();
          router.replace(ORGANIZATION_ROUTES.products);
        },
      }
    );
  }

  function acceptAsSignedInPerson() {
    acceptanceMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.next === "SWITCH_CONTEXT") {
          openOrganization(result.organizationId);
        }
      },
    });
  }

  function handlePasswordSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = parseFormData(
      invitationPasswordFormSchema,
      new FormData(formElement)
    );
    if (!result.success) {
      setFieldErrors(result.errors);
      focusFirstInvalidField(formElement, result.errors);
      return;
    }
    setFieldErrors({});
    acceptanceMutation.mutate(result.data.password, {
      onError: (error) => {
        if (error instanceof PlatformApiError) {
          focusFirstInvalidField(formElement, error.fieldErrors);
        }
      },
    });
  }

  const organizationName = preview?.organization.name ?? "your organisation";
  const heading = acceptance
    ? `You have joined ${organizationName}`
    : invitationToken === null
      ? "Open your invitation link"
      : isGone
        ? "This invitation can no longer be used"
        : preview
          ? `Join ${organizationName}`
          : "Your invitation";
  const introduction = acceptance
    ? acceptance.next === "SIGN_IN"
      ? "Sign in with your email address and new password. You will set up an authenticator app first."
      : "Opening your new organisation."
    : invitationToken === null
      ? "Open the link from your invitation email or text message. If it does not work, ask the person who invited you to send a new one."
      : isGone
        ? "It has expired or was already used. Ask the person who invited you to send a new link."
        : preview
          ? `${preview.invitedBy} invited you to work with ${organizationName} on HealthAlyst.`
          : "Checking your invitation.";

  function renderContent() {
    if (invitationToken === undefined || previewQuery.isPending) {
      return invitationToken === null ? null : (
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Checking your invitation"
          presentation="inline"
        />
      );
    }
    if (isGone) return null;
    if (previewQuery.isError) {
      return (
        <FormMessage tone="error">{previewQuery.error.message}</FormMessage>
      );
    }
    if (!preview) return null;

    if (acceptance?.next === "SIGN_IN") {
      return (
        <Link
          className={PRIMARY_LINK_CLASS_NAME}
          href={ORGANIZATION_ROUTES.signIn}
        >
          Go to sign in
        </Link>
      );
    }
    if (acceptance?.next === "SWITCH_CONTEXT") {
      return contextMutation.isError ? (
        <div className="flex flex-col gap-4">
          <FormMessage tone="error">
            {contextMutation.error.message}
          </FormMessage>
          <ActionButton
            type="button"
            size="large"
            className="w-full"
            onClick={() => openOrganization(acceptance.organizationId)}
          >
            Open {organizationName}
          </ActionButton>
        </div>
      ) : (
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label={`Opening ${organizationName}`}
          presentation="inline"
        />
      );
    }

    if (!preview.accountExists) {
      return (
        <form
          className="flex flex-col gap-5"
          onSubmit={handlePasswordSubmit}
          noValidate
        >
          <InvitationSummary preview={preview} />
          {preview.email && (
            <p className="text-sm text-muted-foreground">
              You will sign in with {preview.email}.
            </p>
          )}
          <TextField
            autoComplete="new-password"
            id="invitation-password"
            label="Choose a password"
            name="password"
            type="password"
            required
            maxLength={PASSWORD_LIMITS.maximum}
            disabled={acceptanceMutation.isPending}
            description={`Use at least ${PASSWORD_LIMITS.minimum} characters.`}
            error={
              fieldErrors.password ??
              (acceptanceMutation.error instanceof PlatformApiError
                ? acceptanceMutation.error.fieldErrors.password
                : undefined)
            }
          />
          <TextField
            autoComplete="new-password"
            id="invitation-confirmPassword"
            label="Enter the password again"
            name="confirmPassword"
            type="password"
            required
            maxLength={PASSWORD_LIMITS.maximum}
            disabled={acceptanceMutation.isPending}
            error={fieldErrors.confirmPassword}
          />
          {acceptanceMutation.error &&
            !(
              acceptanceMutation.error instanceof PlatformApiError &&
              acceptanceMutation.error.fieldErrors.password
            ) && (
              <FormMessage tone="error">
                {acceptanceMutation.error.message}
              </FormMessage>
            )}
          <ActionButton
            type="submit"
            size="large"
            className="w-full"
            isLoading={acceptanceMutation.isPending}
            loadingText="Joining"
          >
            Join {organizationName}
          </ActionButton>
        </form>
      );
    }

    if (isRestoring) {
      return (
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Checking your sign-in"
          presentation="inline"
        />
      );
    }

    if (!platformSession) {
      return (
        <div className="flex flex-col gap-5">
          <InvitationSummary preview={preview} />
          <p className="text-sm text-muted-foreground">
            You already have a HealthAlyst account
            {preview.email ? ` with ${preview.email}` : ""}. Sign in, then open
            the invitation link again to join.
          </p>
          <Link
            className={PRIMARY_LINK_CLASS_NAME}
            href={ORGANIZATION_ROUTES.signIn}
          >
            Sign in
          </Link>
        </div>
      );
    }

    const signedInEmail = platformSession.user.email;
    const isDifferentAccount = Boolean(
      preview.email &&
      signedInEmail &&
      preview.email.toLowerCase() !== signedInEmail.toLowerCase()
    );

    return (
      <div className="flex flex-col gap-5">
        <InvitationSummary preview={preview} />
        {isDifferentAccount && (
          <NoticeBanner
            tone="warning"
            title="This invitation is for another account"
          >
            It was sent to {preview.email}, but you are signed in as{" "}
            {signedInEmail}. Sign out and sign in with the invited account.
          </NoticeBanner>
        )}
        {acceptanceMutation.error && (
          <FormMessage tone="error">
            {acceptanceMutation.error.message}
          </FormMessage>
        )}
        <ActionButton
          type="button"
          size="large"
          className="w-full"
          disabled={isDifferentAccount}
          isLoading={acceptanceMutation.isPending}
          loadingText="Joining"
          onClick={acceptAsSignedInPerson}
        >
          Join {organizationName}
        </ActionButton>
      </div>
    );
  }

  return (
    <OrganizationCenteredLayout pageTitle={heading}>
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
        <ContentPanel frame="wide-screens">{renderContent()}</ContentPanel>
      </div>
    </OrganizationCenteredLayout>
  );
}
