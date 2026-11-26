"use client";

import Link from "next/link";
import {
  CallPatientIcon,
  CheckIcon,
  LeftWithoutBeingSeenIcon,
  SeePatientIcon,
  SendOnIcon,
  SkipPatientIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import {
  DetailList,
  type DetailListItem,
} from "@healthalyst/ui/components/detail-list";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import {
  NOT_TRIAGED_TAG,
  QUEUE_ENTRY_STATUS_PRESENTATION,
  TRIAGE_BAND_PRESENTATION,
} from "~/features/patient-flow/config/patient-flow";
import type {
  QueueEntry,
  TriageRecord,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describeMinutes,
  describePatientName,
  isLiveEntryStatus,
} from "~/features/patient-flow/utilities/front-desk";
import { describeQueue } from "~/features/patient-flow/utilities/queue-targets";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import {
  CONSCIOUSNESS_OPTIONS,
  TRIAGE_PERMISSIONS,
} from "~/features/patient-flow/config/triage";
import { useTriageHistory } from "~/features/patient-flow/hooks/use-patient-flow";
import { PATIENT_PERMISSIONS } from "~/features/patients/config/patients";
import { VisitProgressPanel } from "~/features/patient-flow/components/visit-progress-panel";
import { describeBranchClockTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

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
  onLeft,
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
  /** The patient went home before being seen. */
  onLeft: (entry: QueueEntry) => void;
}) {
  const { permissions } = useWorkspace();
  const canReadPatients = permissions.includes(PATIENT_PERMISSIONS.read);
  const canReadTriage = permissions.includes(TRIAGE_PERMISSIONS.record);
  const isBusy = pendingAction !== null;
  const details: DetailListItem[] = entry
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
            <StatusLabel {...TRIAGE_BAND_PRESENTATION[entry.triageBand]} />
          ) : (
            <StatusLabel {...NOT_TRIAGED_TAG} />
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
          <StatusLabel {...QUEUE_ENTRY_STATUS_PRESENTATION[entry.status]} />
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
            {entry.status !== "IN_SERVICE" && (
              <ActionButton
                type="button"
                variant="outline"
                disabled={isBusy}
                leadingIcon={<LeftWithoutBeingSeenIcon className="size-4" />}
                onClick={() => onLeft(entry)}
              >
                Left without being seen
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
        {entry && canReadPatients && (
          <Link
            href={HEALTH_SCHEDULE_ROUTES.patient(entry.patient.id)}
            className="w-fit text-sm text-primary underline-offset-4 hover:underline"
          >
            Open {describePatientName(entry.patient)}&apos;s record
          </Link>
        )}
        <DetailList items={details} />
        {entry && canReadTriage && entry.triageBand && (
          <EarlierTriage visitId={entry.visitId} />
        )}
        {entry && <VisitProgressPanel visitId={entry.visitId} />}
      </div>
    </DetailSheet>
  );
}

/** "Temperature 38.6 °C · Pulse 96 · BP 120/80 · Oxygen 94%". */
function describeVitals(record: TriageRecord): string {
  const consciousness = CONSCIOUSNESS_OPTIONS.find(
    (option) => option.value === record.consciousness
  )?.label;
  return [
    record.temperatureC !== null
      ? `Temperature ${record.temperatureC} °C`
      : null,
    record.heartRate !== null ? `Pulse ${record.heartRate}` : null,
    record.respiratoryRate !== null
      ? `Breathing ${record.respiratoryRate}`
      : null,
    record.systolicBp !== null
      ? `BP ${record.systolicBp}${record.diastolicBp !== null ? `/${record.diastolicBp}` : ""}`
      : null,
    record.spo2 !== null ? `Oxygen ${record.spo2}%` : null,
    record.glucoseMmolL !== null
      ? `Glucose ${record.glucoseMmolL} mmol/L`
      : null,
    record.painScore !== null ? `Pain ${record.painScore}/10` : null,
    consciousness ?? null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The latest triage of the visit, for whoever calls the patient next. */
function EarlierTriage({ visitId }: { visitId: string }) {
  const historyQuery = useTriageHistory(visitId, true);
  if (historyQuery.isPending) {
    return (
      <LoadingPlaceholder
        label="Loading the triage"
        rows={[{ shape: "text" }]}
      />
    );
  }
  if (historyQuery.isError) {
    return (
      <NoticeBanner tone="information" title="Triage details not shown">
        {historyQuery.error.message}
      </NoticeBanner>
    );
  }
  const [latest, ...earlier] = historyQuery.data;
  if (!latest) return null;
  const vitals = describeVitals(latest);
  return (
    <section className="flex flex-col gap-2 text-sm">
      <h3 className="flex flex-wrap items-center gap-2 font-medium">
        Triage at {describeBranchClockTime(latest.recordedAt)}
        {earlier.length > 0 ? ` (and ${earlier.length} earlier)` : ""}
        <StatusLabel {...TRIAGE_BAND_PRESENTATION[latest.band]} />
      </h3>
      {latest.complaint && <p>Complaint: {latest.complaint}</p>}
      {vitals && <p className="text-muted-foreground">{vitals}</p>}
      {latest.notes && <p>Nursing note: {latest.notes}</p>}
      {latest.overrideReason && (
        <p className="text-muted-foreground">
          Band chosen below emergency: {latest.overrideReason}
        </p>
      )}
    </section>
  );
}
