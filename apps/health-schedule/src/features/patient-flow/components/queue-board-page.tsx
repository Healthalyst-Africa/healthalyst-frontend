"use client";

import { useState } from "react";
import { CallPatientIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { ToolbarSelect } from "@healthalyst/ui/components/toolbar-select";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import { PatientFlowFrame } from "~/features/patient-flow/components/patient-flow-frame";
import {
  QueueEntrySheet,
  type QueueEntryAction,
} from "~/features/patient-flow/components/queue-entry-sheet";
import { LeftWithoutBeingSeenDialog } from "~/features/patient-flow/components/left-without-being-seen-dialog";
import { SendOnDialog } from "~/features/patient-flow/components/send-on-dialog";
import {
  CLOCK_STATE_TONES,
  PATIENT_FLOW_PERMISSIONS,
  QUEUE_ENTRY_STATUS_PRESENTATION,
  TRIAGE_BAND_PRESENTATION,
} from "~/features/patient-flow/config/patient-flow";
import {
  useDayBoard,
  useQueueActions,
  useQueueEntries,
  useQueueSummaries,
} from "~/features/patient-flow/hooks/use-patient-flow";
import type { QueueEntry } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describePatientName,
  describeWait,
  isLiveEntryStatus,
  readFlowEmphasis,
} from "~/features/patient-flow/utilities/front-desk";
import {
  buildQueueBoardOptions,
  buildQueueTargetOptions,
  decodeQueueTarget,
  describeQueue,
  encodeQueueTarget,
  readQueueTargetChoices,
  type QueueTarget,
} from "~/features/patient-flow/utilities/queue-targets";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const TRIAGE_QUEUE: QueueTarget = { kind: "TRIAGE" };

/** Nurses, doctors and departments work through their queue here. */
export function QueueBoardPage() {
  return (
    <PatientFlowFrame
      title="Queues"
      description="Choose your queue, then call patients one at a time: the most urgent first, then whoever came first."
      requiredPermission={PATIENT_FLOW_PERMISSIONS.readQueues}
      missingPermissionName="View queues and patient flow"
    >
      {(branch) => <QueueBoard branch={branch} />}
    </PatientFlowFrame>
  );
}

function QueueBoard({ branch }: { branch: WorkspaceBranch }) {
  const { permissions } = useWorkspace();
  const canManage = permissions.includes(PATIENT_FLOW_PERMISSIONS.manageQueues);
  const canReadAppointments = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readAppointments
  );
  const [queueValue, setQueueValue] = useState(encodeQueueTarget(TRIAGE_QUEUE));
  const queue = decodeQueueTarget(queueValue) ?? TRIAGE_QUEUE;
  const [openEntry, setOpenEntry] = useState<QueueEntry | null>(null);
  const [sendingOnEntry, setSendingOnEntry] = useState<QueueEntry | null>(null);
  const [finishingEntry, setFinishingEntry] = useState<QueueEntry | null>(null);
  const [leavingEntry, setLeavingEntry] = useState<QueueEntry | null>(null);
  const [pendingAction, setPendingAction] = useState<QueueEntryAction | null>(
    null
  );
  const [sheetError, setSheetError] = useState<string | null>(null);

  const dayBoardQuery = useDayBoard(branch.id, canReadAppointments);
  const summariesQuery = useQueueSummaries(branch.id, true);
  const entriesQuery = useQueueEntries(branch.id, queue, true);
  const actions = useQueueActions(branch.id);

  const choices = readQueueTargetChoices(
    dayBoardQuery.data,
    branch.departments
  );
  const boardOptions = buildQueueBoardOptions(
    choices,
    summariesQuery.data ?? []
  );
  const queueLabel =
    boardOptions.find((option) => option.value === queueValue)?.label ??
    "Triage";
  const sendOnOptions = buildQueueTargetOptions(choices).filter(
    (option) => option.value !== queueValue
  );
  const waitingCount = (entriesQuery.data ?? []).filter(
    (entry) => entry.status === "WAITING"
  ).length;

  function openPatient(entry: QueueEntry) {
    setSheetError(null);
    setOpenEntry(entry);
  }

  function runAction(action: QueueEntryAction, entry: QueueEntry) {
    const mutation = actions[action];
    setPendingAction(action);
    setSheetError(null);
    mutation.mutate(entry.id, {
      onSuccess: (updatedEntry) => {
        setOpenEntry(updatedEntry);
        announceSuccess(
          action === "call"
            ? `Calling ${updatedEntry.token}, ${describePatientName(updatedEntry.patient)}`
            : action === "start"
              ? `${describePatientName(updatedEntry.patient)} is with you`
              : `${describePatientName(updatedEntry.patient)} is back in the queue`
        );
      },
      onError: (error) => setSheetError(error.message),
      onSettled: () => setPendingAction(null),
    });
  }

  function callNext() {
    actions.callNext.mutate(queue, {
      onSuccess: (entry) => {
        announceSuccess(
          `Calling ${entry.token}, ${describePatientName(entry.patient)}`
        );
        openPatient(entry);
      },
    });
  }

  const columns: readonly DataTableColumn<QueueEntry>[] = [
    {
      key: "token",
      label: "Number",
      size: "compact",
      getCell: (entry) => ({
        kind: "text",
        primary: entry.token,
        secondary: entry.appointment ? "Booked" : "Walk-in",
      }),
    },
    {
      key: "patient",
      label: "Patient",
      size: "wide",
      getCell: (entry) => ({
        kind: "text",
        primary: describePatientName(entry.patient),
        secondary:
          queue.kind === "TRIAGE"
            ? entry.patient.patientNumber
            : `For ${describeQueue(entry)}`,
      }),
    },
    {
      key: "status",
      label: "Status",
      size: "compact",
      getCell: (entry) =>
        isLiveEntryStatus(entry.status)
          ? {
              kind: "status",
              ...QUEUE_ENTRY_STATUS_PRESENTATION[entry.status],
            }
          : { kind: "status", label: entry.status, tone: "neutral" },
    },
    {
      key: "triage",
      label: "Triage",
      size: "compact",
      getCell: (entry) =>
        entry.triageBand
          ? { kind: "status", ...TRIAGE_BAND_PRESENTATION[entry.triageBand] }
          : { kind: "status", label: "Not yet", tone: "neutral" },
    },
    {
      key: "waiting",
      label: "Waiting",
      size: "compact",
      getCell: (entry) => ({
        kind: "status",
        label: describeWait(entry.waitingMinutes, entry.waitState),
        tone: entry.waitState ? CLOCK_STATE_TONES[entry.waitState] : "neutral",
      }),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div data-tour="queue-choice">
          <ToolbarSelect
            label="Queue"
            placeholder="Choose a queue"
            value={queueValue}
            options={boardOptions}
            onValueChange={(value) => {
              setQueueValue(value);
              actions.callNext.reset();
            }}
          />
        </div>
        {canManage && (
          <ActionButton
            data-tour="queue-call-next"
            type="button"
            isLoading={actions.callNext.isPending}
            loadingText="Calling"
            disabled={waitingCount === 0}
            leadingIcon={<CallPatientIcon className="size-4" />}
            onClick={callNext}
          >
            Call next patient
          </ActionButton>
        )}
      </div>
      {actions.callNext.isError && (
        <NoticeBanner tone="error" title="Nobody was called">
          {actions.callNext.error.message}
        </NoticeBanner>
      )}
      <div data-tour="queue-list">
        <DataTable
          accessibleLabel={`${queueLabel} queue`}
          columns={columns}
          state={
            entriesQuery.isPending
              ? { status: "loading", label: "Loading the queue" }
              : entriesQuery.isError
                ? {
                    status: "error",
                    title: "We could not load this queue",
                    description: entriesQuery.error.message,
                    retryLabel: "Try again",
                    onRetry: () => void entriesQuery.refetch(),
                  }
                : { status: "ready", rows: entriesQuery.data }
          }
          getRowIdentifier={(entry) => entry.id}
          getRowEmphasis={(entry) =>
            readFlowEmphasis({
              triageBand: entry.triageBand,
              waitState: entry.waitState,
            })
          }
          rowAction={{
            label: (entry) =>
              `Open ${entry.token}, ${describePatientName(entry.patient)}`,
            onSelect: openPatient,
          }}
          emptyState={{
            illustration: <EmptyReviewQueueIllustration />,
            title: "Nobody is in this queue",
            description:
              "Patients appear here when they are checked in or sent on. The list updates on its own.",
          }}
        />
      </div>

      <QueueEntrySheet
        entry={openEntry}
        onOpenChange={(open) => {
          if (!open) setOpenEntry(null);
        }}
        canManage={canManage}
        pendingAction={pendingAction}
        error={sheetError}
        onAction={runAction}
        onSendOn={(entry) => {
          actions.sendOn.reset();
          setSendingOnEntry(entry);
        }}
        onFinish={(entry) => {
          actions.finish.reset();
          setFinishingEntry(entry);
        }}
        onLeft={setLeavingEntry}
      />
      <LeftWithoutBeingSeenDialog
        entry={leavingEntry}
        onOpenChange={(open) => {
          if (!open) setLeavingEntry(null);
        }}
        mutation={actions.left}
        onRecorded={() => {
          setLeavingEntry(null);
          setOpenEntry(null);
        }}
      />
      <SendOnDialog
        entry={sendingOnEntry}
        onOpenChange={(open) => {
          if (!open) setSendingOnEntry(null);
        }}
        queueTargetOptions={sendOnOptions}
        isSubmitting={actions.sendOn.isPending}
        error={actions.sendOn.error}
        onSubmit={(request) => {
          if (!sendingOnEntry) return;
          actions.sendOn.mutate(
            { entryId: sendingOnEntry.id, request },
            {
              onSuccess: (nextEntry) => {
                announceSuccess(
                  `${describePatientName(nextEntry.patient)} is waiting for ${describeQueue(nextEntry)}`
                );
                setSendingOnEntry(null);
                setOpenEntry(null);
              },
            }
          );
        }}
      />
      <FormDialog
        open={finishingEntry !== null}
        onOpenChange={(open) => {
          if (!open) setFinishingEntry(null);
        }}
        title={
          finishingEntry
            ? `Finish ${describePatientName(finishingEntry.patient)}'s visit?`
            : "Finish the visit?"
        }
        description="They leave every queue and the visit closes. Send them on instead if anyone else still needs to see them."
        submitLabel="Finish visit"
        submittingLabel="Finishing visit"
        isSubmitting={actions.finish.isPending}
        error={actions.finish.error?.message}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          if (!finishingEntry) return;
          actions.finish.mutate(finishingEntry.visitId, {
            onSuccess: () => {
              announceSuccess(
                `${describePatientName(finishingEntry.patient)}'s visit is finished`
              );
              setFinishingEntry(null);
              setOpenEntry(null);
            },
          });
        }}
      >
        {null}
      </FormDialog>
    </div>
  );
}
