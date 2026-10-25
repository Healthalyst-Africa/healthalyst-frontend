"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { StatusPanel } from "@healthalyst/ui/components/status-panel";
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
        <p role="status" className="text-sm text-muted-foreground">
          Loading review queue…
        </p>
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
        <StatusPanel
          tone="information"
          message="No submitted applications are awaiting review."
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
