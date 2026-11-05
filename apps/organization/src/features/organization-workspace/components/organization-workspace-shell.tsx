"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { AccountSecurityIcon, SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { DashboardShell } from "@healthalyst/ui/components/dashboard-shell";
import { WorkspaceSwitcher } from "@healthalyst/ui/components/workspace-switcher";
import { getProductApplicationAddresses } from "~/config/application-addresses";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { useSignOutMutation } from "~/features/authentication/hooks/use-sign-in";
import { usePlatformSession } from "~/infrastructure/auth/platform-session-provider";
import { buildOrganizationWorkspaceNavigation } from "~/features/organization-workspace/utilities/build-workspace-navigation";
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
  const { clearPlatformSession } = usePlatformSession();
  const signOutMutation = useSignOutMutation();
  const membership = findActiveMembership(platformSession);
  const organizationName = membership?.organization.name ?? "Your organisation";
  const navigation = buildOrganizationWorkspaceNavigation({
    permissions: platformSession.activeContext.permissions ?? [],
    enabledProductCodes: membership?.products ?? [],
    productAddresses: getProductApplicationAddresses(),
  });

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
      {children}
    </DashboardShell>
  );
}
