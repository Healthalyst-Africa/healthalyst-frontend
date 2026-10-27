"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import { Suspense } from "react";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";
import { useOrganizationDirectory } from "~/features/organization-oversight/hooks/use-organization-directory";
import { OrganizationApplicationsTable } from "~/features/organization-oversight/components/organization-applications-table";

import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export function OrganizationDirectoryPage() {
  const { staffIdentity } = useStaffSession();
  if (!staffIdentity) return null;
  return (
    <Suspense
      fallback={
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Loading organisations"
          presentation="inline"
        />
      }
    >
      <OrganizationsList staffIdentity={staffIdentity} />
    </Suspense>
  );
}

function OrganizationsList({
  staffIdentity,
}: {
  staffIdentity: StaffIdentity;
}) {
  const { searchTerm, organizationsQuery, matchingOrganizations } =
    useOrganizationDirectory(staffIdentity);
  return (
    <>
      <div>
        <h1 className="font-serif text-title font-normal tracking-tight">
          Organisations
        </h1>
        <p className="mt-2 text-lede text-muted-foreground">
          Registration details and current access decisions.
        </p>
      </div>
      <OrganizationApplicationsTable
        applications={matchingOrganizations}
        isLoading={organizationsQuery.isPending}
        errorMessage={organizationsQuery.error?.message}
        onRetry={() => void organizationsQuery.refetch()}
        searchTerm={searchTerm}
      />
    </>
  );
}
