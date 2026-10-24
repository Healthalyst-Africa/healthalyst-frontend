"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Card, CardContent } from "@healthalyst/ui/components/card";
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
        <h1 className="text-2xl font-semibold tracking-tight">
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
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              {reviewQueue.error.message}
            </p>
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void reviewQueue.refetch()}
            >
              Retry loading queue
            </ActionButton>
          </CardContent>
        </Card>
      )}
      {reviewQueue.isSuccess && reviewQueue.data.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No submitted applications are awaiting review.
          </CardContent>
        </Card>
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
