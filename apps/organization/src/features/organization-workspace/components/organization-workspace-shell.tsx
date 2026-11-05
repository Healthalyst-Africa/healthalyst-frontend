"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { AccountSecurityIcon, SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { DashboardShell } from "@healthalyst/ui/components/dashboard-shell";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { WorkspaceSwitcher } from "@healthalyst/ui/components/workspace-switcher";
import { getProductApplicationAddresses } from "~/config/application-addresses";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { usePlatformContextSwitchMutation } from "~/features/authentication/hooks/use-platform-authentication";
import { useSignOutMutation } from "~/features/authentication/hooks/use-sign-in";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import {
  buildOrganizationWorkspaceNavigation,
  type WorkspaceOrganization,
} from "~/features/organization-workspace/utilities/build-workspace-navigation";
import { findActiveMembership } from "~/shared/organization/utilities/find-active-membership";

/**
 * The signed-in frame for an approved organisation's pages in the hub. Its
 * sidebar holds the hub's pages; the header switcher and account menu match
 * HealthSchedule's, so moving between the apps works the same way in both.
 */
export function OrganizationWorkspaceShell({
  platformSession,
  children,
}: {
  platformSession: PlatformSession;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { clearPlatformSession, restoreSession } = usePlatformSession();
  const signOutMutation = useSignOutMutation();
  const contextMutation = usePlatformContextSwitchMutation();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const membership = findActiveMembership(platformSession);
  const organizationName = membership?.organization.name ?? "Your organisation";

  function switchOrganization(organization: WorkspaceOrganization) {
    setSwitchingTo(organization.name);
    contextMutation.mutate(
      { context: { organizationId: organization.id } },
      {
        // The session's permissions and products belong to the new
        // organisation; its products page is the safe place to land.
        onSuccess: async () => {
          await restoreSession();
          router.push(ORGANIZATION_ROUTES.products);
          setSwitchingTo(null);
        },
        onError: () => setSwitchingTo(null),
      }
    );
  }

  const navigation = buildOrganizationWorkspaceNavigation({
    permissions: platformSession.activeContext.permissions ?? [],
    enabledProductCodes: membership?.products ?? [],
    productAddresses: getProductApplicationAddresses(),
    organizations: platformSession.memberships.map(
      (organizationMembership) => organizationMembership.organization
    ),
    currentOrganizationId: membership?.organization.id ?? null,
    switchOrganization,
  });

  if (switchingTo) {
    return (
      <BrandLoader
        markSource={BRAND_MARK_SOURCE}
        label={`Switching to ${switchingTo}`}
      />
    );
  }

  return (
    <DashboardShell
      brand={
        <WorkspaceSwitcher
          logo={
            <Image
              src="/logo.jpg"
              alt=""
              width={32}
              height={32}
              className="rounded-md"
            />
          }
          title="Organisation"
          subtitle={organizationName}
          sections={navigation.switcher}
          linkComponent={Link}
        />
      }
      navigationLabel="Organisation"
      navigationSections={navigation.sidebar}
      navigationLocation={pathname}
      linkComponent={Link}
      toolbar={
        <p className="truncate text-sm font-medium">{organizationName}</p>
      }
      actions={
        <AccountMenu
          fullName={`${platformSession.user.firstName} ${platformSession.user.lastName}`}
          emailAddress={platformSession.user.email ?? ""}
          error={signOutMutation.error?.message}
          actions={[
            {
              label: "Account security",
              icon: <AccountSecurityIcon aria-hidden="true" />,
              onSelect: () => router.push(ORGANIZATION_ROUTES.accountSecurity),
            },
            {
              label: "Sign out",
              pendingLabel: "Signing out…",
              isPending: signOutMutation.isPending,
              icon: <SignOutIcon aria-hidden="true" />,
              tone: "destructive",
              onSelect: () =>
                signOutMutation.mutate(undefined, {
                  onSuccess: clearPlatformSession,
                }),
            },
          ]}
        />
      }
    >
      {contextMutation.isError && (
        <NoticeBanner
          tone="error"
          title="We could not switch organisation"
          className="mb-6"
        >
          {contextMutation.error.message}
        </NoticeBanner>
      )}
      {children}
    </DashboardShell>
  );
}
