"use client";

import Link from "next/link";
import { PageBreadcrumbs } from "@healthalyst/ui/components/page-breadcrumbs";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import { OrganizationBranchesSection } from "~/features/organization-settings/components/organization-branches-section";
import { OrganizationProfileSection } from "~/features/organization-settings/components/organization-profile-section";
import { OrganizationSettingsFrame } from "~/features/organization-settings/components/organization-settings-frame";

/** An approved organisation's profile and its list of branches. */
export function OrganizationSettingsPage() {
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
                currentPage="Organisation settings"
              />
            </div>
            <h1 className="font-serif text-display font-normal">
              {settings.organizationName}
            </h1>
            <p className="max-w-2xl text-lede text-muted-foreground">
              Your organisation&apos;s details and the branches people work
              from.
            </p>
          </div>

          <OrganizationProfileSection
            organizationId={settings.organizationId}
            userId={settings.userId}
            canEdit={settings.canEditProfile}
          />
          <OrganizationBranchesSection
            organizationId={settings.organizationId}
            userId={settings.userId}
            canManage={settings.canManageBranches}
          />
        </div>
      )}
    </OrganizationSettingsFrame>
  );
}
