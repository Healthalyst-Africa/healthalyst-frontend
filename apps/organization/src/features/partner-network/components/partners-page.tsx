"use client";

import { useState } from "react";
import Link from "next/link";
import { InviteIcon, SearchIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { PageBreadcrumbs } from "@healthalyst/ui/components/page-breadcrumbs";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { OrganizationSettingsFrame } from "~/features/organization-settings/components/organization-settings-frame";
import { FindPartnerSheet } from "~/features/partner-network/components/find-partner-sheet";
import { InvitePartnerDialog } from "~/features/partner-network/components/invite-partner-dialog";
import { PartnershipSheet } from "~/features/partner-network/components/partnership-sheet";
import {
  ACCESS_LEVEL_LABELS,
  PARTNER_DATE_FORMATTER,
  PARTNER_INVITATION_STATUS_PRESENTATION,
  PARTNER_PERMISSIONS,
  PARTNERSHIP_STATUS_PRESENTATION,
  SERVICE_CATEGORY_LABELS,
} from "~/features/partner-network/config/partner-network";
import {
  usePartnerInvitationsQuery,
  usePartnershipsQuery,
} from "~/features/partner-network/hooks/use-partner-network";
import type {
  PartnerInvitation,
  PartnerScope,
  Partnership,
} from "~/features/partner-network/types/partner-network";
import {
  describeDirection,
  describeOrganizationPlace,
  describeOrganizationType,
  describeState,
} from "~/features/partner-network/utilities/describe-partner";
import {
  isAwaitingOurReply,
  sortPartnerships,
} from "~/features/partner-network/utilities/partnership-actions";

const PARTNERSHIP_COLUMNS: readonly DataTableColumn<Partnership>[] = [
  {
    key: "partner",
    label: "Partner",
    size: "wide",
    getCell: (partnership) => ({
      kind: "text",
      primary: `${partnership.partner.name}${partnership.isPreferred && partnership.direction === "OUTGOING" ? " (preferred)" : ""}`,
      secondary: describeOrganizationPlace(
        partnership.partner.type,
        describeState(partnership.partner.stateCode)
      ),
    }),
  },
  {
    key: "service",
    label: "Service",
    getCell: (partnership) => ({
      kind: "text",
      primary: describeDirection(partnership),
      secondary: ACCESS_LEVEL_LABELS[partnership.accessLevel],
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (partnership) => ({
      kind: "status",
      ...PARTNERSHIP_STATUS_PRESENTATION[partnership.status],
    }),
  },
  {
    key: "since",
    label: "Requested",
    size: "compact",
    getCell: (partnership) => ({
      kind: "date",
      label: PARTNER_DATE_FORMATTER.format(new Date(partnership.createdAt)),
      dateTime: partnership.createdAt,
    }),
  },
];

const INVITATION_COLUMNS: readonly DataTableColumn<PartnerInvitation>[] = [
  {
    key: "organisation",
    label: "Organisation",
    size: "wide",
    getCell: (invitation) => ({
      kind: "text",
      primary: invitation.partnerName,
      secondary: `${describeOrganizationType(invitation.partnerType) ?? ""}, ${invitation.email}`,
    }),
  },
  {
    key: "service",
    label: "Service",
    getCell: (invitation) => ({
      kind: "text",
      primary: SERVICE_CATEGORY_LABELS[invitation.serviceCategory],
      secondary: ACCESS_LEVEL_LABELS[invitation.accessLevel],
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (invitation) => ({
      kind: "status",
      ...PARTNER_INVITATION_STATUS_PRESENTATION[invitation.status],
    }),
  },
  {
    key: "expires",
    label: "Link expires",
    size: "compact",
    getCell: (invitation) => ({
      kind: "date",
      label: PARTNER_DATE_FORMATTER.format(new Date(invitation.expiresAt)),
      dateTime: invitation.expiresAt,
    }),
  },
];

function PartnersWorkspace({
  scope,
  permissions,
}: {
  scope: PartnerScope;
  permissions: readonly string[];
}) {
  const canRead = permissions.includes(PARTNER_PERMISSIONS.read);
  const canManage = permissions.includes(PARTNER_PERMISSIONS.manage);
  const partnershipsQuery = usePartnershipsQuery(scope, canRead);
  const invitationsQuery = usePartnerInvitationsQuery(scope, canRead);
  const [selectedPartnershipId, setSelectedPartnershipId] = useState<
    string | null
  >(null);
  const [isFinding, setIsFinding] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);

  if (!canRead) {
    return (
      <StateNotice tone="information" title="You cannot see partners">
        Your roles do not include viewing partners. Ask an organisation
        administrator if you need this.
      </StateNotice>
    );
  }

  const partnerships = partnershipsQuery.data ?? [];
  const waitingRequests = partnerships.filter(isAwaitingOurReply);
  const otherPartnerships = sortPartnerships(
    partnerships.filter((partnership) => !isAwaitingOurReply(partnership))
  );
  // Read the partnership from the latest list so the panel shows saved changes.
  const selectedPartnership =
    partnerships.find(
      (partnership) => partnership.id === selectedPartnershipId
    ) ?? null;
  const partnershipState = (rows: readonly Partnership[]) =>
    partnershipsQuery.isPending
      ? ({ status: "loading", label: "Loading your partners" } as const)
      : partnershipsQuery.isError
        ? ({
            status: "error",
            title: "We could not load your partners",
            description: partnershipsQuery.error.message,
            retryLabel: "Try again",
            onRetry: () => void partnershipsQuery.refetch(),
          } as const)
        : ({ status: "ready", rows } as const);

  return (
    <div className="flex flex-col gap-10">
      {notice && (
        <NoticeBanner tone="success" title={notice.title}>
          {notice.description}
        </NoticeBanner>
      )}

      {canManage && (
        <div className="flex flex-wrap gap-3">
          <ActionButton
            type="button"
            leadingIcon={<SearchIcon className="size-4" />}
            onClick={() => {
              setNotice(null);
              setIsFinding(true);
            }}
          >
            Find a partner
          </ActionButton>
          <ActionButton
            type="button"
            variant="outline"
            leadingIcon={<InviteIcon className="size-4" />}
            onClick={() => {
              setNotice(null);
              setIsInviting(true);
            }}
          >
            Invite an organisation not on HealthAlyst
          </ActionButton>
        </div>
      )}

      {waitingRequests.length > 0 && (
        <section
          aria-labelledby="partner-requests-heading"
          className="flex flex-col gap-4"
        >
          <SectionHeading
            headingIdentifier="partner-requests-heading"
            heading="Requests waiting for you"
            description="Organisations that want to send you work. Accepting signs the data-sharing agreement."
          />
          <DataTable
            accessibleLabel="Partnership requests waiting for you"
            columns={PARTNERSHIP_COLUMNS}
            state={partnershipState(waitingRequests)}
            getRowIdentifier={(partnership) => partnership.id}
            rowAction={{
              label: (partnership) =>
                `Review the request from ${partnership.partner.name}`,
              onSelect: (partnership) =>
                setSelectedPartnershipId(partnership.id),
            }}
            emptyState={{ title: "No requests are waiting" }}
          />
        </section>
      )}

      <section
        aria-labelledby="partners-heading"
        className="flex flex-col gap-4"
      >
        <SectionHeading
          headingIdentifier="partners-heading"
          heading="Your partners"
          description="Organisations you send work to, and organisations that send work to you."
        />
        <DataTable
          accessibleLabel="Your partners"
          columns={PARTNERSHIP_COLUMNS}
          state={partnershipState(otherPartnerships)}
          getRowIdentifier={(partnership) => partnership.id}
          rowAction={{
            label: (partnership) => `Open ${partnership.partner.name}`,
            onSelect: (partnership) => setSelectedPartnershipId(partnership.id),
          }}
          emptyState={{
            illustration: <EmptyOrganizationsIllustration />,
            title: "No partners yet",
            description: canManage
              ? "Find a laboratory, pharmacy or other organisation to send work to."
              : "Partners appear here once your organisation works with others.",
          }}
        />
      </section>

      <section
        aria-labelledby="partner-invitations-heading"
        className="flex flex-col gap-4"
      >
        <SectionHeading
          headingIdentifier="partner-invitations-heading"
          heading="Invitations"
          description="Organisations you invited to join HealthAlyst as partners."
        />
        <DataTable
          accessibleLabel="Partner invitations"
          columns={INVITATION_COLUMNS}
          state={
            invitationsQuery.isPending
              ? { status: "loading", label: "Loading invitations" }
              : invitationsQuery.isError
                ? {
                    status: "error",
                    title: "We could not load your invitations",
                    description: invitationsQuery.error.message,
                    retryLabel: "Try again",
                    onRetry: () => void invitationsQuery.refetch(),
                  }
                : { status: "ready", rows: invitationsQuery.data }
          }
          getRowIdentifier={(invitation) => invitation.id}
          emptyState={{
            illustration: <EmptySearchIllustration />,
            title: "No invitations sent",
            description:
              "Invite an organisation that is not on HealthAlyst to work with you.",
          }}
        />
      </section>

      <PartnershipSheet
        partnership={selectedPartnership}
        scope={scope}
        canManage={canManage}
        onClose={() => setSelectedPartnershipId(null)}
      />
      {canManage && (
        <>
          <FindPartnerSheet
            open={isFinding}
            onOpenChange={setIsFinding}
            scope={scope}
            onRequested={(partnership) =>
              setNotice({
                title: `Request sent to ${partnership.partner.name}`,
                description: `You can send them ${SERVICE_CATEGORY_LABELS[partnership.serviceCategory].toLowerCase()} work once they accept.`,
              })
            }
          />
          <InvitePartnerDialog
            open={isInviting}
            onOpenChange={setIsInviting}
            scope={scope}
            onInvited={(invitation) =>
              setNotice({
                title: `Invitation sent to ${invitation.partnerName}`,
                description: `We emailed ${invitation.email}. Their link works until ${PARTNER_DATE_FORMATTER.format(new Date(invitation.expiresAt))}.`,
              })
            }
          />
        </>
      )}
    </div>
  );
}

/** Organisations this one works with, requests to answer, and invitations. */
export function PartnersPage() {
  return (
    <OrganizationSettingsFrame>
      {(settings) => (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <PageBreadcrumbs
                linkComponent={Link}
                trail={[
                  { label: "Products", href: ORGANIZATION_ROUTES.products },
                ]}
                currentPage="Partners"
              />
            </div>
            <h1 className="font-serif text-display font-normal">Partners</h1>
            <p className="text-body text-muted-foreground">
              The laboratories, pharmacies and other organisations{" "}
              {settings.organizationName} works with.
            </p>
          </div>
          <PartnersWorkspace
            scope={{
              organizationId: settings.organizationId,
              userId: settings.userId,
            }}
            permissions={settings.permissions}
          />
        </div>
      )}
    </OrganizationSettingsFrame>
  );
}
