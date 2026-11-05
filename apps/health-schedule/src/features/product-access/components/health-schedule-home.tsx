"use client";

import Image from "next/image";
import Link from "next/link";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { AccountSecurityIcon, SignOutIcon } from "@healthalyst/icons";
import { AccountMenu } from "@healthalyst/ui/components/account-menu";
import { DashboardShell } from "@healthalyst/ui/components/dashboard-shell";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { WorkspaceSwitcher } from "@healthalyst/ui/components/workspace-switcher";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { getOrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";
import { buildHealthScheduleNavigation } from "~/features/product-access/utilities/build-health-schedule-navigation";
import { useHealthScheduleSignOut } from "~/features/product-access/hooks/use-health-schedule-sign-out";

/** The signed-in HealthSchedule workspace for an approved organisation. */
export function HealthScheduleHome({
  platformSession,
  organizationName,
}: {
  platformSession: PlatformSession;
  organizationName: string;
}) {
  const signOutMutation = useHealthScheduleSignOut();
  const { user } = platformSession;
  const organizationAppLinks = getOrganizationAppLinks();
  const navigation = buildHealthScheduleNavigation({
    permissions: platformSession.activeContext.permissions ?? [],
    organizationAppLinks,
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
          title="HealthSchedule"
          subtitle={organizationName}
          sections={navigation.switcher}
          linkComponent={Link}
        />
      }
      navigationLabel="HealthSchedule"
      navigationSections={navigation.sidebar}
      navigationLocation="/"
      linkComponent={Link}
      toolbar={
        <p className="truncate text-sm font-medium">{organizationName}</p>
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
        <div>
          <h1 className="font-serif text-title font-normal tracking-tight">
            Welcome, {user.firstName}
          </h1>
          <p className="mt-2 text-lede text-muted-foreground">
            {organizationName} is set up for HealthSchedule.
          </p>
        </div>
        <EmptyState
          surface="panel"
          illustration={<DocumentsCompleteIllustration />}
          title="Your workspace is ready"
          description="Scheduling tools will appear here as they become available to your organisation."
        />
      </div>
    </DashboardShell>
  );
}
