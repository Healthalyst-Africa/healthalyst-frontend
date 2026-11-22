"use client";

import { useState } from "react";
import { BookAppointmentIcon, DeleteIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { ScheduleEntryList } from "@healthalyst/ui/components/schedule-entry-list";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  APPOINTMENT_TEXT_LIMITS,
  TIME_OF_DAY_OPTIONS,
} from "~/features/appointments/config/appointments";
import {
  useRemoveFromWaitlist,
  useWaitlist,
} from "~/features/appointments/hooks/use-appointments";
import type { WaitlistEntry } from "~/features/appointments/schemas/appointment-response-schemas";
import {
  describeShortDate,
  slotDate,
} from "~/features/appointments/utilities/slot-choices";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import { describePatientName } from "~/features/patient-flow/utilities/front-desk";
import { ReasonDialog } from "~/shared/forms/reason-dialog";
import { describeBranchDate } from "~/shared/time/branch-time";

function describeWaitingFor(entry: WaitlistEntry): string {
  const timeOfDay =
    TIME_OF_DAY_OPTIONS.find((option) => option.value === entry.timeOfDay)
      ?.label ?? "Any time";
  return [
    entry.appointmentTypeName,
    entry.resourceName ? `with ${entry.resourceName}` : null,
    `${describeShortDate(entry.fromDate)} – ${describeShortDate(entry.toDate)}`,
    timeOfDay.toLowerCase(),
    entry.patient.phone,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Patients waiting for a time to come free at the branch, longest waiting
 * first, to book when a time suits them.
 */
export function WaitlistPanel({
  branch,
  canBook,
  onBook,
}: {
  branch: WorkspaceBranch;
  canBook: boolean;
  onBook: (entry: WaitlistEntry) => void;
}) {
  const waitlistQuery = useWaitlist(branch.id, true);
  const removeMutation = useRemoveFromWaitlist();
  const [removing, setRemoving] = useState<WaitlistEntry | null>(null);
  const entries = waitlistQuery.data ?? [];

  return (
    <ContentPanel
      data-tour="appointments-waitlist"
      heading="Waitlist"
      headingLevel={2}
      description="Patients waiting for a time to come free. When someone cancels, check here first."
    >
      {waitlistQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading the waitlist"
          rows={[{ shape: "text" }, { shape: "text" }]}
        />
      ) : waitlistQuery.isError ? (
        <NoticeBanner
          tone="error"
          title="We could not load the waitlist"
          action={
            <ActionButton
              type="button"
              variant="outline"
              size="compact"
              onClick={() => void waitlistQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          {waitlistQuery.error.message}
        </NoticeBanner>
      ) : entries.length === 0 ? (
        <EmptyState
          surface="plain"
          illustration={<EmptyReviewQueueIllustration />}
          title="Nobody is waiting"
          description="When no time suits a patient, add them to the waitlist from the booking screen."
        />
      ) : (
        <ScheduleEntryList
          timeColumn="date-time"
          entries={entries.map((entry) => ({
            id: entry.id,
            time: `Since ${describeShortDate(slotDate(entry.waitingSince))}`,
            period: `Waiting since ${describeBranchDate(entry.waitingSince)}`,
            title: describePatientName(entry.patient),
            details: describeWaitingFor(entry),
            status: entry.isExpired
              ? { label: "Dates passed", tone: "warning" }
              : { label: "Waiting", tone: "information" },
            attention: entry.notes ?? undefined,
            actions: canBook
              ? [
                  {
                    label: "Book a time",
                    icon: <BookAppointmentIcon />,
                    onSelect: () => onBook(entry),
                  },
                  {
                    label: "Take off the waitlist",
                    icon: <DeleteIcon />,
                    tone: "destructive",
                    separatedAbove: true,
                    onSelect: () => setRemoving(entry),
                  },
                ]
              : [],
          }))}
        />
      )}
      <ReasonDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
            removeMutation.reset();
          }
        }}
        identifier="remove-from-waitlist"
        title={
          removing
            ? `Take ${describePatientName(removing.patient)} off the waitlist`
            : "Take off the waitlist"
        }
        reasonLabel="Reason"
        reasonHint="For example: booked elsewhere, or no longer needs it."
        minimumLength={APPOINTMENT_TEXT_LIMITS.reasonMinimum}
        maximumLength={APPOINTMENT_TEXT_LIMITS.reasonMaximum}
        submitLabel="Take off the waitlist"
        submittingLabel="Removing"
        tone="destructive"
        isSubmitting={removeMutation.isPending}
        error={
          removeMutation.isError ? removeMutation.error.message : undefined
        }
        onSubmit={(reason) => {
          if (!removing) return;
          removeMutation.mutate(
            { entryId: removing.id, reason },
            {
              onSuccess: () => {
                announceSuccess(
                  `${describePatientName(removing.patient)} is off the waitlist`
                );
                setRemoving(null);
              },
            }
          );
        }}
      />
    </ContentPanel>
  );
}
