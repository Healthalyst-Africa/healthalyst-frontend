"use client";

import { useState } from "react";
import { BookAppointmentIcon, DeleteIcon } from "@healthalyst/icons";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
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

function describeTimeOfDay(entry: WaitlistEntry): string {
  return (
    TIME_OF_DAY_OPTIONS.find((option) => option.value === entry.timeOfDay)
      ?.label ?? "Any time"
  );
}

const WAITLIST_COLUMNS: readonly DataTableColumn<WaitlistEntry>[] = [
  {
    key: "patient",
    label: "Patient",
    size: "wide",
    getCell: (entry) => ({
      kind: "text",
      primary: describePatientName(entry.patient),
      secondary: entry.patient.phone ?? undefined,
    }),
  },
  {
    key: "for",
    label: "Waiting for",
    getCell: (entry) => ({
      kind: "text",
      primary: entry.appointmentTypeName,
      secondary: entry.resourceName ? `with ${entry.resourceName}` : "Anyone",
    }),
  },
  {
    key: "when",
    label: "Could come",
    getCell: (entry) => ({
      kind: "text",
      primary: `${describeShortDate(entry.fromDate)} – ${describeShortDate(entry.toDate)}`,
      secondary: describeTimeOfDay(entry),
    }),
  },
  {
    key: "since",
    label: "Waiting since",
    size: "compact",
    getCell: (entry) => ({
      kind: "text",
      primary: describeShortDate(slotDate(entry.waitingSince)),
    }),
  },
  {
    key: "status",
    label: "Status",
    size: "compact",
    getCell: (entry) =>
      entry.isExpired
        ? { kind: "status", label: "Dates passed", tone: "warning" }
        : { kind: "status", label: "Waiting", tone: "information" },
  },
];

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

  return (
    <ContentPanel
      data-tour="appointments-waitlist"
      heading="Waitlist"
      headingLevel={2}
      description="Patients waiting for a time to come free. When someone cancels, check here first."
    >
      <DataTable
        accessibleLabel="Patients on the waitlist"
        columns={WAITLIST_COLUMNS}
        state={
          waitlistQuery.isPending
            ? { status: "loading", label: "Loading the waitlist" }
            : waitlistQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the waitlist",
                  description: waitlistQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void waitlistQuery.refetch(),
                }
              : { status: "ready", rows: waitlistQuery.data }
        }
        getRowIdentifier={(entry) => entry.id}
        getRowActions={(entry) =>
          canBook
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
            : []
        }
        getRowActionsLabel={(entry) =>
          `Actions for ${describePatientName(entry.patient)}`
        }
        emptyState={{
          illustration: <EmptyReviewQueueIllustration />,
          title: "Nobody is waiting",
          description:
            "When no time suits a patient, add them to the waitlist from the booking screen.",
        }}
      />
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
