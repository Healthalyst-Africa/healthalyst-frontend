"use client";

import Link from "next/link";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SummaryDetailList } from "@healthalyst/ui/components/review-summary";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { OrganizationRegistrationForm } from "~/features/organization-registration";
import {
  PARTNER_DATE_FORMATTER,
  PARTNER_INVITATION_GONE_STATUS,
  PARTNER_PERMISSIONS,
  SERVICE_CATEGORY_LABELS,
} from "~/features/partner-network/config/partner-network";
import {
  usePartnerInvitationAcceptanceMutation,
  usePartnerInvitationPreviewQuery,
} from "~/features/partner-network/hooks/use-partner-network";
import type { PartnerInvitationPreview } from "~/features/partner-network/types/partner-network";
import { describeOrganizationType } from "~/features/partner-network/utilities/describe-partner";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import { APPROVED_ORGANIZATION_STATUS } from "~/shared/organization/config/organization-status";
import { findActiveMembership } from "~/shared/organization/utilities/find-active-membership";

const LINK_CLASS_NAME =
  "font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** The API's code when an organisation opens its own invitation. */
const OWN_INVITATION_ERROR_CODE = "OWN_INVITATION";

/**
 * Accepts the invitation for an organisation already on HealthAlyst. The
 * request it creates is then accepted on the partners page, with the
 * data-sharing agreement.
 */
function AcceptAsSignedInOrganization({
  invitationToken,
  preview,
}: {
  invitationToken: string;
  preview: PartnerInvitationPreview;
}) {
  const { platformSession, isRestoring } = usePlatformSession();
  const acceptanceMutation =
    usePartnerInvitationAcceptanceMutation(invitationToken);
  const membership = platformSession
    ? findActiveMembership(platformSession)
    : undefined;
  const isApproved =
    membership?.organization.status === APPROVED_ORGANIZATION_STATUS;
  const canManage = (platformSession?.activeContext.permissions ?? []).includes(
    PARTNER_PERMISSIONS.manage
  );

  if (isRestoring) return null;

  if (acceptanceMutation.isSuccess) {
    return (
      <NoticeBanner
        tone="success"
        title={`${preview.invitedBy.name}'s request is waiting for you`}
        action={
          <Link className={LINK_CLASS_NAME} href={ORGANIZATION_ROUTES.partners}>
            Review it on Partners
          </Link>
        }
      >
        Accept it there with the data-sharing agreement to start working
        together.
      </NoticeBanner>
    );
  }

  if (!platformSession || !membership || !isApproved) {
    return (
      <NoticeBanner
        tone="information"
        title="Is your organisation already on HealthAlyst?"
      >
        <Link className={LINK_CLASS_NAME} href={ORGANIZATION_ROUTES.signIn}>
          Sign in
        </Link>
        , then open the invitation link from your email again to accept it.
      </NoticeBanner>
    );
  }

  if (!canManage) {
    return (
      <NoticeBanner
        tone="information"
        title={`You are signed in to ${membership.organization.name}`}
      >
        Your roles do not include managing partners. Ask an organisation
        administrator to open this link.
      </NoticeBanner>
    );
  }

  const isOwnInvitation =
    acceptanceMutation.error instanceof PlatformApiError &&
    acceptanceMutation.error.code === OWN_INVITATION_ERROR_CODE;

  return (
    <NoticeBanner
      tone="information"
      title={`Accept as ${membership.organization.name}`}
      action={
        <ActionButton
          type="button"
          isLoading={acceptanceMutation.isPending}
          loadingText="Accepting invitation"
          onClick={() => acceptanceMutation.mutate()}
        >
          Accept invitation
        </ActionButton>
      }
    >
      {isOwnInvitation
        ? "Your organisation sent this invitation, so it cannot accept it."
        : (acceptanceMutation.error?.message ??
          "Your organisation is already on HealthAlyst, so you do not need to register again.")}
    </NoticeBanner>
  );
}

/**
 * Opened from a partner invitation email. New organisations register with
 * details filled in from the invitation; organisations already on
 * HealthAlyst accept it instead.
 */
export function PartnerInvitationLanding({
  invitationToken,
}: {
  invitationToken: string;
}) {
  const { isRestoring } = usePlatformSession();
  const previewQuery = usePartnerInvitationPreviewQuery(
    invitationToken,
    !isRestoring
  );
  const preview = previewQuery.data;
  const isGone =
    previewQuery.error instanceof PlatformApiError &&
    previewQuery.error.status === PARTNER_INVITATION_GONE_STATUS;

  if (previewQuery.isPending) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label="Checking your invitation"
        presentation="inline"
      />
    );
  }

  if (isGone) {
    return (
      <div className="flex flex-col gap-6">
        <StateNotice
          tone="warning"
          title="This partner invitation can no longer be used"
        >
          It has expired or was already used. Ask the organisation that invited
          you to send a new one, or register without it.
        </StateNotice>
        <OrganizationRegistrationForm />
      </div>
    );
  }

  if (previewQuery.isError || !preview) {
    return (
      <StateNotice
        tone="error"
        title="We could not open this invitation"
        action={
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => void previewQuery.refetch()}
          >
            Try again
          </ActionButton>
        }
      >
        {previewQuery.error?.message ?? "Try again."}
      </StateNotice>
    );
  }

  const service = SERVICE_CATEGORY_LABELS[preview.serviceCategory];

  return (
    <div className="flex flex-col gap-6">
      <NoticeBanner
        tone="information"
        title={`${preview.invitedBy.name} invited ${preview.partnerName} to work with them`}
      >
        <SummaryDetailList
          details={[
            { label: "Service", value: service },
            {
              label: "Invited by",
              value: [
                preview.invitedBy.name,
                describeOrganizationType(preview.invitedBy.type),
              ]
                .filter(Boolean)
                .join(", "),
            },
            { label: "Sent to", value: preview.email },
            {
              label: "Link expires",
              value: PARTNER_DATE_FORMATTER.format(new Date(preview.expiresAt)),
            },
          ]}
        />
      </NoticeBanner>
      <AcceptAsSignedInOrganization
        invitationToken={invitationToken}
        preview={preview}
      />
      <OrganizationRegistrationForm
        partnerInvitationToken={invitationToken}
        initialValues={{
          legalName: preview.partnerName,
          organizationType: preview.partnerType,
          organizationEmailAddress: preview.email,
        }}
      />
    </div>
  );
}
