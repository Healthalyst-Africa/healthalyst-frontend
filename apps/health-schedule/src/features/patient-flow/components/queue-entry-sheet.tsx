"use client";

import type { ReactNode } from "react";
import {
  CallPatientIcon,
  CheckIcon,
  SeePatientIcon,
  SendOnIcon,
  SkipPatientIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import {
  QUEUE_ENTRY_STATUS_PRESENTATION,
  TRIAGE_BAND_PRESENTATION,
} from "~/features/patient-flow/config/patient-flow";
import type { QueueEntry } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describeMinutes,
  describePatientName,
  isLiveEntryStatus,
} from "~/features/patient-flow/utilities/front-desk";
import { describeQueue } from "~/features/patient-flow/utilities/queue-targets";
import { describeBranchClockTime } from "~/shared/time/branch-time";

export type QueueEntryAction = "call" | "start" | "skip";

/**
 * One patient in a queue and what staff can do next: call them, start
 * seeing them, skip them when they do not come, send them on or finish the
 * visit.
 */
export function QueueEntrySheet({
  entry,
  onOpenChange,
  canManage,
  pendingAction,
  error,
  onAction,
  onSendOn,
  onFinish,
}: {
  entry: QueueEntry | null;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  /** The action in progress, if any. */
  pendingAction: QueueEntryAction | null;
  error: string | null;
  onAction: (action: QueueEntryAction, entry: QueueEntry) => void;
  onSendOn: (entry: QueueEntry) => void;
  onFinish: (entry: QueueEntry) => void;
}) {
  const isBusy = pendingAction !== null;
  const details: { term: string; description: ReactNode }[] = entry
    ? [
        { term: "Patient number", description: entry.patient.patientNumber },
        {
          term: "Phone",
          description: entry.patient.phone ?? "Not recorded",
        },
        {
          term: "Came for",
          description: entry.appointment
            ? `${entry.appointment.appointmentTypeName}, booked ${describeBranchClockTime(entry.appointment.startsAt)}`
            : "Walk-in",
        },
        {
          term: "Triage",
          description: entry.triageBand ? (
            <StatusLabel tone={TRIAGE_BAND_PRESENTATION[entry.triageBand].tone}>
              {TRIAGE_BAND_PRESENTATION[entry.triageBand].label}
            </StatusLabel>
          ) : (
            "Not triaged yet"
          ),
        },
        {
          term: "Waiting",
          description: `${describeMinutes(entry.waitingMinutes)} (target ${describeMinutes(entry.waitTargetMinutes)})`,
        },
        {
          term: "Joined this queue",
          description: describeBranchClockTime(entry.enqueuedAt),
        },
        ...(entry.skipCount > 0
          ? [
              {
                term: "Skipped",
                description: `${entry.skipCount} ${entry.skipCount === 1 ? "time" : "times"}`,
              },
            ]
          : []),
        { term: "Note", description: entry.note ?? "No note" },
      ]
    : [];

  return (
    <DetailSheet
      open={entry !== null}
      onOpenChange={onOpenChange}
      title={
        entry ? `${entry.token} · ${describePatientName(entry.patient)}` : ""
      }
      description={entry ? describeQueue(entry) : undefined}
      titleAccessory={
        entry &&
        isLiveEntryStatus(entry.status) && (
          <StatusLabel
            tone={QUEUE_ENTRY_STATUS_PRESENTATION[entry.status].tone}
          >
            {QUEUE_ENTRY_STATUS_PRESENTATION[entry.status].label}
          </StatusLabel>
        )
      }
      footer={
        entry &&
        canManage && (
          <div className="flex flex-wrap gap-2">
            {entry.status === "WAITING" && (
              <ActionButton
                type="button"
                isLoading={pendingAction === "call"}
                loadingText="Calling"
                disabled={isBusy}
                leadingIcon={<CallPatientIcon className="size-4" />}
                onClick={() => onAction("call", entry)}
              >
                Call
              </ActionButton>
            )}
            {(entry.status === "WAITING" || entry.status === "CALLED") && (
              <ActionButton
                type="button"
                variant={entry.status === "CALLED" ? "default" : "outline"}
                isLoading={pendingAction === "start"}
                loadingText="Starting"
                disabled={isBusy}
                leadingIcon={<SeePatientIcon className="size-4" />}
                onClick={() => onAction("start", entry)}
              >
                Patient is here
              </ActionButton>
            )}
            {entry.status === "CALLED" && (
              <>
                <ActionButton
                  type="button"
                  variant="outline"
                  isLoading={pendingAction === "call"}
                  loadingText="Calling"
                  disabled={isBusy}
                  leadingIcon={<CallPatientIcon className="size-4" />}
                  onClick={() => onAction("call", entry)}
                >
                  Call again
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="outline"
                  isLoading={pendingAction === "skip"}
                  loadingText="Skipping"
                  disabled={isBusy}
                  leadingIcon={<SkipPatientIcon className="size-4" />}
                  onClick={() => onAction("skip", entry)}
                >
                  Did not come
                </ActionButton>
              </>
            )}
            <ActionButton
              type="button"
              variant={entry.status === "IN_SERVICE" ? "default" : "outline"}
              disabled={isBusy}
              leadingIcon={<SendOnIcon className="size-4" />}
              onClick={() => onSendOn(entry)}
            >
              Send on
            </ActionButton>
            {entry.status === "IN_SERVICE" && (
              <ActionButton
                type="button"
                variant="outline"
                disabled={isBusy}
                leadingIcon={<CheckIcon className="size-4" />}
                onClick={() => onFinish(entry)}
              >
                Finish visit
              </ActionButton>
            )}
          </div>
        )
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <NoticeBanner tone="error" title="That did not work">
            {error}
          </NoticeBanner>
        )}
        <dl className="grid gap-4 text-sm sm:grid-cols-[10rem_1fr]">
          {details.map((detail) => (
            <div key={detail.term} className="contents">
              <dt className="text-muted-foreground">{detail.term}</dt>
              <dd>{detail.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </DetailSheet>
  );
}
