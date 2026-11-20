"use client";

import { useState, type ReactNode } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { SENSITIVE_RECORD_LIMITS } from "~/features/sensitive-records/config/sensitive-records";
import {
  useRecordSensitivity,
  useSensitiveRecordActions,
} from "~/features/sensitive-records/hooks/use-sensitive-records";
import {
  canSeeClinicalHistory,
  resolveRecordAccess,
} from "~/features/sensitive-records/utilities/record-access";
import { ReasonDialog } from "~/shared/forms/reason-dialog";
import { describeBranchClockTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/**
 * Shows a patient's clinical history only to those who may see it. A
 * restricted record shows a lock instead, never its category; clinical
 * staff may open it for four hours with a reason a manager reviews.
 */
export function RecordAccessGate({
  patientId,
  children,
}: {
  patientId: string;
  children: ReactNode;
}) {
  const { permissions } = useWorkspace();
  const sensitivityQuery = useRecordSensitivity(patientId, true);
  const actions = useSensitiveRecordActions(patientId);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);

  if (sensitivityQuery.isPending) {
    return (
      <LoadingPlaceholder
        label="Checking who may see this record"
        rows={[{ shape: "card" }, { shape: "card" }]}
      />
    );
  }

  if (sensitivityQuery.isError) {
    return (
      <StateNotice
        tone="error"
        title="We could not check who may see this record"
        action={
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => void sensitivityQuery.refetch()}
          >
            Try again
          </ActionButton>
        }
      >
        <p>{sensitivityQuery.error.message}</p>
      </StateNotice>
    );
  }

  const access = resolveRecordAccess(sensitivityQuery.data, permissions);

  if (!canSeeClinicalHistory(access)) {
    return (
      <>
        <StateNotice
          tone="warning"
          title="This record is restricted"
          action={
            access.state === "locked-can-open" && (
              <ActionButton
                type="button"
                onClick={() => {
                  actions.requestEmergencyAccess.reset();
                  setIsRequestingAccess(true);
                }}
              >
                Open in an emergency
              </ActionButton>
            )
          }
        >
          <p>
            Only the patient’s care team can see their notes, problems and
            clinical documents. Registration details and allergies stay visible
            to everyone who can see patients.
          </p>
          {access.state === "locked" && (
            <p>Ask a clinician in the patient’s care team for help.</p>
          )}
        </StateNotice>
        <ReasonDialog
          open={isRequestingAccess}
          onOpenChange={setIsRequestingAccess}
          identifier="emergency-access"
          title="Open this record in an emergency?"
          description={`It opens for ${SENSITIVE_RECORD_LIMITS.emergencyAccessHours} hours. Your reason and every view are logged, and a manager reviews whether the access was needed.`}
          reasonLabel="Why you need to see this record now"
          reasonHint="For example, the patient is unconscious and you need their history."
          minimumLength={SENSITIVE_RECORD_LIMITS.emergencyReasonMinimum}
          maximumLength={SENSITIVE_RECORD_LIMITS.emergencyReasonMaximum}
          submitLabel="Open the record"
          submittingLabel="Opening"
          isSubmitting={actions.requestEmergencyAccess.isPending}
          error={actions.requestEmergencyAccess.error?.message}
          onSubmit={(reason) =>
            actions.requestEmergencyAccess.mutate(reason, {
              onSuccess: (grant) => {
                announceSuccess(
                  `Record open until ${describeBranchClockTime(grant.expiresAt)}`
                );
                setIsRequestingAccess(false);
              },
            })
          }
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {access.state === "emergency-access" && (
        <NoticeBanner tone="warning" title="Opened in an emergency">
          {access.until
            ? `You can see this record until ${describeBranchClockTime(access.until)}. `
            : ""}
          Every view is logged, and a manager reviews the access.
        </NoticeBanner>
      )}
      {access.state === "care-team" && (
        <NoticeBanner tone="information" title="Sensitive record">
          You can see it because you care for this patient. Every view is
          logged.
        </NoticeBanner>
      )}
      {children}
    </div>
  );
}
