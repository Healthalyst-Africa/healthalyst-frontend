"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailList } from "@healthalyst/ui/components/detail-list";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { MERGE_REASON_LENGTH } from "~/features/patients/config/patients";
import {
  useMergeActions,
  useMerges,
} from "~/features/patients/hooks/use-patient-record-sections";
import { usePatientDetails } from "~/features/patients/hooks/use-patients";
import {
  undoMergeFormSchema,
  type UndoMergeFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type {
  Patient,
  PatientMerge,
} from "~/features/patients/schemas/patient-response-schemas";
import {
  canUndoMerge,
  describeMergeField,
  describeMergeState,
} from "~/features/patients/utilities/merge-presentation";
import {
  describeDate,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { describeBranchClockTime } from "~/shared/time/branch-time";

/** Clearer words for the reasons an undo is refused. */
const UNDO_REFUSALS: Readonly<Record<string, string>> = {
  MERGE_UNDO_EXPIRED: "The 30 days to undo this merge have passed.",
  PATIENT_CHANGED_SINCE_MERGE:
    "The record has changed since the merge, so it can no longer be undone. Correct the details on the record instead.",
};

function describeRecord(
  patientId: string,
  patientsById: ReadonlyMap<string, Patient>
): { primary: string; secondary?: string } {
  const patient = patientsById.get(patientId);
  if (!patient) return { primary: "Loading" };
  return {
    primary: describePatientFullName(patient),
    secondary: patient.patientNumber,
  };
}

/** Merges of the last 90 days, newest first, each open to review or undo. */
export function RecentMergesPanel() {
  const mergesQuery = useMerges(true);
  const merges = mergesQuery.data ?? [];
  const patientIds = [
    ...new Set(merges.flatMap((merge) => [merge.survivorId, merge.mergedId])),
  ];
  const patientQueries = usePatientDetails(patientIds);
  const patientsById = new Map<string, Patient>(
    patientQueries.flatMap((patientQuery) =>
      patientQuery.data ? [[patientQuery.data.id, patientQuery.data]] : []
    )
  );
  const [reviewingMerge, setReviewingMerge] = useState<PatientMerge | null>(
    null
  );
  const now = new Date();

  const columns: readonly DataTableColumn<PatientMerge>[] = [
    {
      key: "kept",
      label: "Record kept",
      size: "wide",
      getCell: (merge) => ({
        kind: "text",
        ...describeRecord(merge.survivorId, patientsById),
      }),
    },
    {
      key: "merged",
      label: "Merged into it",
      getCell: (merge) => ({
        kind: "text",
        ...describeRecord(merge.mergedId, patientsById),
      }),
    },
    {
      key: "date",
      label: "Merged",
      size: "compact",
      getCell: (merge) => ({
        kind: "date",
        label: describeDate(merge.mergedAt),
        dateTime: merge.mergedAt,
      }),
    },
    {
      key: "state",
      label: "Undo",
      size: "compact",
      getCell: (merge) => ({
        kind: "status",
        ...describeMergeState(merge, now),
      }),
    },
  ];

  return (
    <ContentPanel
      heading="Recent merges"
      headingLevel={2}
      description="Duplicate records merged in the last 90 days. A merge can be undone for 30 days, while neither record has changed."
    >
      <DataTable
        accessibleLabel="Recent merges"
        columns={columns}
        state={
          mergesQuery.isPending
            ? { status: "loading", label: "Loading recent merges" }
            : mergesQuery.isError
              ? {
                  status: "error",
                  title: "We could not load recent merges",
                  description: mergesQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void mergesQuery.refetch(),
                }
              : { status: "ready", rows: merges }
        }
        getRowIdentifier={(merge) => merge.id}
        emptyState={{
          illustration: <EmptyReviewQueueIllustration />,
          title: "No merges in the last 90 days",
          description:
            "Possible duplicates show on a patient's record, where they can be compared and merged.",
        }}
        rowAction={{
          label: (merge) =>
            `Review the merge into ${describeRecord(merge.survivorId, patientsById).primary}`,
          onSelect: setReviewingMerge,
        }}
      />
      <MergeReviewDialog
        merge={reviewingMerge}
        patientsById={patientsById}
        onOpenChange={(open) => {
          if (!open) setReviewingMerge(null);
        }}
      />
    </ContentPanel>
  );
}

const EMPTY_UNDO: UndoMergeFormValues = { reason: "" };

function MergeReviewDialog({
  merge,
  patientsById,
  onOpenChange,
}: {
  merge: PatientMerge | null;
  patientsById: ReadonlyMap<string, Patient>;
  onOpenChange: (open: boolean) => void;
}) {
  const { undo } = useMergeActions();
  const form = useForm<UndoMergeFormValues>({
    resolver: zodResolver(undoMergeFormSchema),
    defaultValues: EMPTY_UNDO,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const isUndoable = merge !== null && canUndoMerge(merge, new Date());

  useEffect(() => {
    if (merge) {
      form.reset(EMPTY_UNDO);
      undo.reset();
    }
    // Reset only when a different merge is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merge]);

  const submit = form.handleSubmit(
    (values) => {
      if (!merge || !isUndoable) {
        onOpenChange(false);
        return;
      }
      undo.mutate(
        { mergeId: merge.id, reason: values.reason.trim() },
        {
          onSuccess: () => {
            announceSuccess("Merge undone: both records are open again");
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, ["reason"]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, { reason: "undo-merge-reason" })
  );

  const refusal =
    undo.error instanceof PlatformApiError
      ? UNDO_REFUSALS[undo.error.code ?? ""]
      : undefined;

  function recordLink(patientId: string) {
    const record = describeRecord(patientId, patientsById);
    return (
      <Link
        href={HEALTH_SCHEDULE_ROUTES.patient(patientId)}
        className="text-primary underline-offset-4 hover:underline"
      >
        {record.secondary
          ? `${record.primary} (${record.secondary})`
          : record.primary}
      </Link>
    );
  }

  return (
    <FormDialog
      open={merge !== null}
      onOpenChange={(nextOpen) => {
        if (!undo.isPending) onOpenChange(nextOpen);
      }}
      title="Merged records"
      submitLabel={isUndoable ? "Undo merge" : "Close"}
      submittingLabel="Undoing"
      tone={isUndoable ? "destructive" : "default"}
      isSubmitting={undo.isPending}
      error={
        refusal ??
        (undo.isError && Object.keys(errors).length === 0
          ? undo.error.message
          : undefined)
      }
      onSubmit={(formEvent) => {
        if (isUndoable) {
          void submit(formEvent);
          return;
        }
        formEvent.preventDefault();
        onOpenChange(false);
      }}
    >
      {merge && (
        <>
          <DetailList
            items={[
              {
                term: "Record kept",
                description: recordLink(merge.survivorId),
              },
              {
                term: "Merged into it",
                description: recordLink(merge.mergedId),
              },
              {
                term: "Merged",
                description: `${describeDate(merge.mergedAt)} at ${describeBranchClockTime(merge.mergedAt)}`,
              },
              {
                term: "Details taken from the merged record",
                description:
                  merge.fieldsTaken.length > 0
                    ? merge.fieldsTaken.map(describeMergeField).join(", ")
                    : "None",
              },
              { term: "Reason", description: merge.reason },
              ...(merge.undoneAt
                ? [
                    {
                      term: "Undone",
                      description: [
                        describeDate(merge.undoneAt),
                        merge.undoReason,
                      ]
                        .filter(Boolean)
                        .join(": "),
                    },
                  ]
                : []),
            ]}
          />
          {isUndoable ? (
            <TextAreaField
              id="undo-merge-reason"
              label="Why undo it?"
              required
              description="Both records open again, with the details they had before."
              rows={2}
              maxLength={MERGE_REASON_LENGTH.maximum}
              error={errors.reason?.message}
              {...form.register("reason")}
            />
          ) : (
            !merge.undoneAt && (
              <NoticeBanner tone="information" title="This merge is final">
                The 30 days to undo it have passed.
              </NoticeBanner>
            )
          )}
        </>
      )}
    </FormDialog>
  );
}
