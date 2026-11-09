"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { AccountSecurityIcon, SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { DashboardShell } from "@healthalyst/ui/components/dashboard-shell";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { WorkspaceSwitcher } from "@healthalyst/ui/components/workspace-switcher";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { BranchPicker } from "~/features/branch-selection/components/branch-picker";
import { useBranchSelection } from "~/features/branch-selection/hooks/use-branch-selection";
import { getOrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";
import { buildHealthScheduleNavigation } from "~/features/product-access/utilities/build-health-schedule-navigation";
import { useHealthScheduleSignOut } from "~/features/product-access/hooks/use-health-schedule-sign-out";
import { useOrganizationSwitch } from "~/features/product-access/hooks/use-organization-switch";
import { WorkspaceProvider } from "~/shared/workspace/workspace-context";

/**
 * The frame around every HealthSchedule page for an approved organisation:
 * navigation, the branch picker and the account menu. Pages read the
 * session, permissions and branch through `useWorkspace`.
 */
export function HealthScheduleShell({
  platformSession,
  organizationName,
  children,
}: {
  platformSession: PlatformSession;
  organizationName: string;
  children: ReactNode;
}) {
  const signOutMutation = useHealthScheduleSignOut();
  const { user } = platformSession;
  const organizationSwitch = useOrganizationSwitch();
  const branchSelection = useBranchSelection(platformSession);
  const pathname = usePathname();
  const permissions = useMemo(
    () => platformSession.activeContext.permissions ?? [],
    [platformSession]
  );
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const organizationAppLinks = getOrganizationAppLinks();
  const navigation = buildHealthScheduleNavigation({
    permissions,
    organizationAppLinks,
    organizations: platformSession.memberships.map(
      (membership) => membership.organization
    ),
    currentOrganizationId: platformSession.activeContext.organizationId,
    switchOrganization: (organization) => {
      setSwitchingTo(organization.name);
      organizationSwitch.mutate(organization.id, {
        onSettled: () => setSwitchingTo(null),
      });
    },
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
          title="HealthSchedule"
          subtitle={organizationName}
          sections={navigation.switcher}
          linkComponent={Link}
        />
      }
      navigationLabel="HealthSchedule"
      navigationSections={navigation.sidebar}
      navigationLocation={pathname}
      linkComponent={Link}
      toolbar={
        // Until a branch is chosen, the notice below holds the only picker.
        branchSelection.status === "selected" ? (
          <BranchPicker branchSelection={branchSelection} />
        ) : (
          <p className="truncate text-sm font-medium">{organizationName}</p>
        )
      }
      actions={
        <AccountMenu
          fullName={`${user.firstName} ${user.lastName}`}
          emailAddress={user.email ?? ""}
          error={signOutMutation.error?.message}
          actions={[
            // Account security is owned by the organisation hub, which
            // returns here afterwards. Organisation pages are in the sidebar.
            ...(organizationAppLinks
              ? [
                  {
                    label: "Account security",
                    icon: <AccountSecurityIcon aria-hidden="true" />,
                    onSelect: () =>
                      window.location.assign(
                        organizationAppLinks.accountSecurity
                      ),
                  },
                ]
              : []),
            {
              label: "Sign out",
              pendingLabel: "Signing out…",
              isPending: signOutMutation.isPending,
              icon: <SignOutIcon aria-hidden="true" />,
              tone: "destructive",
              onSelect: () => signOutMutation.mutate(),
            },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-6">
        {organizationSwitch.isError && (
          <NoticeBanner tone="error" title="We could not switch organisation">
            {organizationSwitch.error.message}
          </NoticeBanner>
        )}
        <WorkspaceProvider
          value={{
            platformSession,
            organizationName,
            permissions,
            branchSelection,
          }}
        >
          {children}
        </WorkspaceProvider>
      </div>
    </DashboardShell>
  );
}
