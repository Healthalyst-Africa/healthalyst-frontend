"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableState } from "@healthalyst/ui/types/data-table";
import { APPLICATION_ROUTES } from "~/config/application-routes";
import { BRAND_MARK_SOURCE } from "~/config/brand";
import { ReviewApplicationSheet } from "~/features/organization-oversight/components/review-application-sheet";
import {
  REVIEW_APPLICATION_QUERY_PARAMETER,
  REVIEW_ASSIGNMENT_OPTIONS,
  createReviewQueueColumns,
  getReviewAssignment,
  type ReviewAssignment,
} from "~/features/organization-oversight/config/review-queue";
import { useReviewQueueQuery } from "~/features/organization-oversight/hooks/use-organization-oversight";
import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";

import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export function OrganizationReviewPage() {
  const { staffIdentity } = useStaffSession();
  if (!staffIdentity) return null;
  return (
    // The open application is kept in the address.
    <Suspense
      fallback={
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Loading review queue"
          presentation="inline"
        />
      }
    >
      <ReviewQueue staffIdentity={staffIdentity} />
    </Suspense>
  );
}

function isReviewAssignment(value: string): value is ReviewAssignment {
  return REVIEW_ASSIGNMENT_OPTIONS.some((option) => option.value === value);
}

function ReviewQueue({ staffIdentity }: { staffIdentity: StaffIdentity }) {
  const reviewQueue = useReviewQueueQuery(staffIdentity);
  const router = useRouter();
  const pathname = usePathname();
  const searchParameters = useSearchParams();
  const [organizationName, setOrganizationName] = useState("");
  const [assignment, setAssignment] = useState<ReviewAssignment | "">("");
  const lastOpenApplicationReference = useRef<OrganizationApplication | null>(
    null
  );

  const applications = reviewQueue.data ?? [];
  const searchText = organizationName.trim().toLocaleLowerCase("en-NG");
  const filteredApplications = applications.filter(
    (application) =>
      (!assignment ||
        getReviewAssignment(application, staffIdentity.staffAccountId) ===
          assignment) &&
      (!searchText ||
        [application.displayName, application.legalName].some((name) =>
          name.toLocaleLowerCase("en-NG").includes(searchText)
        ))
  );
  const hasFilters = Boolean(searchText || assignment);

  const openApplicationIdentifier = searchParameters.get(
    REVIEW_APPLICATION_QUERY_PARAMETER
  );
  const listedOpenApplication = applications.find(
    (application) => application.id === openApplicationIdentifier
  );
  // A decision can move the application out of the queue; keep showing it
  // until the reviewer closes the panel.
  if (listedOpenApplication) {
    lastOpenApplicationReference.current = listedOpenApplication;
  }
  const openApplication =
    listedOpenApplication ??
    (lastOpenApplicationReference.current?.id === openApplicationIdentifier
      ? lastOpenApplicationReference.current
      : null);

  function setOpenApplication(applicationIdentifier: string | null) {
    const nextSearchParameters = new URLSearchParams(
      searchParameters.toString()
    );
    if (applicationIdentifier) {
      nextSearchParameters.set(
        REVIEW_APPLICATION_QUERY_PARAMETER,
        applicationIdentifier
      );
    } else {
      nextSearchParameters.delete(REVIEW_APPLICATION_QUERY_PARAMETER);
    }
    const query = nextSearchParameters.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  }

  const state: DataTableState<OrganizationApplication> = reviewQueue.isError
    ? {
        status: "error",
        title: "The review queue could not be loaded",
        description: reviewQueue.error.message,
        retryLabel: "Try again",
        onRetry: () => void reviewQueue.refetch(),
      }
    : reviewQueue.isPending
      ? { status: "loading", label: "Loading the review queue" }
      : { status: "ready", rows: filteredApplications };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-title font-normal tracking-tight">
          Application reviews
        </h1>
        <p className="mt-2 text-lede text-muted-foreground">
          Choose an application to check its details and documents, then record
          a decision.
        </p>
      </div>

      <FilterBar
        accessibleLabel="Filter the review queue"
        identifier="review-queue-filters"
        disabled={reviewQueue.isPending || reviewQueue.isError}
        search={{
          label: "Organisation",
          placeholder: "Search by organisation name",
          value: organizationName,
          onValueChange: setOrganizationName,
        }}
        filters={[
          {
            key: "assignment",
            label: "Assignment",
            allOptionsLabel: "All applications",
            options: REVIEW_ASSIGNMENT_OPTIONS,
            value: assignment,
            onValueChange: (value) =>
              setAssignment(isReviewAssignment(value) ? value : ""),
          },
        ]}
      />

      <DataTable
        accessibleLabel="Applications waiting for review"
        columns={createReviewQueueColumns(staffIdentity.staffAccountId)}
        state={state}
        getRowIdentifier={(application) => application.id}
        rowAction={{
          label: (application) =>
            `Review ${application.displayName || application.legalName}`,
          onSelect: (application) => setOpenApplication(application.id),
        }}
        emptyState={
          hasFilters
            ? {
                illustration: <EmptySearchIllustration />,
                title: "No applications match these filters",
                description: "Try a different name or assignment.",
                action: (
                  <ActionButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOrganizationName("");
                      setAssignment("");
                    }}
                  >
                    Clear filters
                  </ActionButton>
                ),
              }
            : {
                illustration: <EmptyReviewQueueIllustration />,
                title: "No applications awaiting review",
                description:
                  "Submitted organisation applications will appear here for you to claim and review.",
                action: (
                  <Link href={APPLICATION_ROUTES.organizations}>
                    View all organisations
                  </Link>
                ),
              }
        }
      />

      {openApplication && (
        <ReviewApplicationSheet
          key={openApplication.id}
          application={openApplication}
          staffIdentity={staffIdentity}
          open
          onOpenChange={(isOpen) => !isOpen && setOpenApplication(null)}
        />
      )}
    </div>
  );
}
