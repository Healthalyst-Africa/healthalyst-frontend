"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@healthalyst/ui/components/card";
import { useStaffSession } from "~/features/staff-auth/context/staff-session-provider";
import { useOrganizationsQuery } from "~/features/organization-oversight/hooks/use-organization-oversight";

export default function OrganizationsPage() {
  const { staffIdentity } = useStaffSession();
  if (!staffIdentity) return null;
  return (
    <Suspense
      fallback={
        <p role="status" className="text-sm text-muted-foreground">
          Loading organisations…
        </p>
      }
    >
      <OrganizationsList staffIdentity={staffIdentity} />
    </Suspense>
  );
}

function OrganizationsList({
  staffIdentity,
}: {
  staffIdentity: NonNullable<
    ReturnType<typeof useStaffSession>["staffIdentity"]
  >;
}) {
  const searchTerm = useSearchParams().get("search")?.trim() ?? "";
  const organizationsQuery = useOrganizationsQuery(staffIdentity);
  const matchingOrganizations = (organizationsQuery.data ?? []).filter(
    (application) =>
      application.organizationName
        .toLocaleLowerCase()
        .includes(searchTerm.toLocaleLowerCase())
  );
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organisations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registration details and current access decisions.
        </p>
      </div>
      {organizationsQuery.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading organisations…
        </p>
      )}
      {organizationsQuery.isError && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              {organizationsQuery.error.message}
            </p>
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void organizationsQuery.refetch()}
            >
              Retry
            </ActionButton>
          </CardContent>
        </Card>
      )}
      {organizationsQuery.isSuccess && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All applications</CardTitle>
            <CardDescription>
              {searchTerm
                ? `${matchingOrganizations.length} results for “${searchTerm}”`
                : `${organizationsQuery.data.length} recorded organisation applications`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchingOrganizations.length === 0 ? (
              <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
                <p>
                  {searchTerm
                    ? "No organisations match this search."
                    : "No organisations have registered yet."}
                </p>
                {searchTerm && (
                  <Link
                    href="/organizations"
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Clear search
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-3 pr-4">Organisation</th>
                      <th className="py-3 pr-4">Product</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchingOrganizations.map((application) => (
                      <tr
                        key={application.applicationId}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-4 pr-4">
                          <p className="font-semibold">
                            {application.organizationName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {application.organizationEmailAddress}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          {application.productInterest}
                        </td>
                        <td className="py-4 pr-4">
                          {application.status
                            .replaceAll("_", " ")
                            .toLowerCase()}
                        </td>
                        <td className="py-4">
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                          }).format(new Date(application.submittedAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
