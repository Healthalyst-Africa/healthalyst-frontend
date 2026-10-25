"use client";
import { BrandLoader } from "@healthalyst/ui/components/brand-loader";
import { BRAND_MARK_SOURCE } from "~/config/brand";

import Link from "next/link";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";
import { APPLICATION_ROUTES } from "~/config/application-routes";
import { ReviewApplicationCard } from "~/features/organization-oversight/components/review-application-card";
import { useReviewQueueQuery } from "~/features/organization-oversight/hooks/use-organization-oversight";
import { useStaffSession } from "~/infrastructure/auth/staff-session-provider";

import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export function OrganizationReviewPage() {
  const { staffIdentity } = useStaffSession();
  if (!staffIdentity) return null;
  return <ReviewQueue staffIdentity={staffIdentity} />;
}

function ReviewQueue({ staffIdentity }: { staffIdentity: StaffIdentity }) {
  const reviewQueue = useReviewQueueQuery(staffIdentity);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight">
          Application reviews
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Claim submitted applications, inspect uploaded documents, and record a
          decision.
        </p>
      </div>
      {reviewQueue.isPending && (
        <BrandLoader
          markSource={BRAND_MARK_SOURCE}
          label="Loading review queue"
          presentation="inline"
        />
      )}
      {reviewQueue.isError && (
        <StatusPanel
          tone="error"
          message={reviewQueue.error.message}
          action={
            <ActionButton
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => void reviewQueue.refetch()}
            >
              Retry loading queue
            </ActionButton>
          }
        />
      )}
      {reviewQueue.isSuccess && reviewQueue.data.length === 0 && (
        <EmptyState
          illustration={<EmptyReviewQueueIllustration />}
          title="No applications awaiting review"
          description="Submitted organisation applications will appear here for you to claim and review."
          action={
            <Link href={APPLICATION_ROUTES.organizations}>
              View all organisations
            </Link>
          }
        />
      )}
      {reviewQueue.data?.map((application) => (
        <ReviewApplicationCard
          key={application.id}
          application={application}
          staffIdentity={staffIdentity}
        />
      ))}
    </div>
  );
}
