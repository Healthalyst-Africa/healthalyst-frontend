"use client";

import { useState } from "react";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import { PatientFlowFrame } from "~/features/patient-flow/components/patient-flow-frame";
import { VitalsForm } from "~/features/patient-flow/components/vitals-form";
import { PATIENT_FLOW_PERMISSIONS } from "~/features/patient-flow/config/patient-flow";
import { TRIAGE_PERMISSIONS } from "~/features/patient-flow/config/triage";
import {
  useDayBoard,
  useQueueEntries,
} from "~/features/patient-flow/hooks/use-patient-flow";
import type {
  DayBoard,
  QueueEntry,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describeClockTag,
  describePatientName,
  describeWait,
  readFlowEmphasis,
} from "~/features/patient-flow/utilities/front-desk";
import {
  buildQueueTargetOptions,
  encodeQueueTarget,
  readQueueTargetChoices,
} from "~/features/patient-flow/utilities/queue-targets";
import { describeBranchClockTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const TRIAGE_QUEUE = { kind: "TRIAGE" } as const;
const NEXT_FREE_DOCTOR = encodeQueueTarget({ kind: "CONSULTATION" });

/** The doctor a booked patient is booked with, if they work today. */
function findBookedDoctor(
  entry: QueueEntry,
  dayBoard: DayBoard | undefined
): string | null {
  if (!entry.appointment) return null;
  const appointmentId = entry.appointment.id;
  const calendar = dayBoard?.calendars.find(
    (candidate) =>
      candidate.kind === "PRACTITIONER" &&
      candidate.appointments.some(
        (appointment) => appointment.id === appointmentId
      )
  );
  return calendar
    ? encodeQueueTarget({
        kind: "CONSULTATION",
        resourceId: calendar.resourceId,
      })
    : null;
}

/** Nurses take vitals and set each patient's triage band. */
export function TriagePage() {
  return (
    <PatientFlowFrame
      title="Vital signs"
      description="Record each new patient's temperature, blood pressure and pulse, decide how urgently they need a doctor, then send them on."
      requiredPermission={TRIAGE_PERMISSIONS.record}
      missingPermissionName="Record vitals and set the triage band"
    >
      {(branch) => <TriageWorkspace branch={branch} />}
    </PatientFlowFrame>
  );
}

function TriageWorkspace({ branch }: { branch: WorkspaceBranch }) {
  const { permissions } = useWorkspace();
  const canReadQueues = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readQueues
  );
  const canReadAppointments = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readAppointments
  );
  const entriesQuery = useQueueEntries(branch.id, TRIAGE_QUEUE, canReadQueues);
  const dayBoardQuery = useDayBoard(branch.id, canReadAppointments);
  const [chosenEntryId, setChosenEntryId] = useState<string | null>(null);

  if (!canReadQueues) {
    return (
      <StateNotice tone="information" title="Your role cannot see the queues">
        <p>
          Ask an organisation administrator to add the “View queues and patient
          flow” permission to your role, so the patients waiting for vital signs
          are listed.
        </p>
      </StateNotice>
    );
  }

  const waitingEntries = entriesQuery.data ?? [];
  const chosenEntry =
    waitingEntries.find((entry) => entry.id === chosenEntryId) ??
    waitingEntries[0] ??
    null;
  const doctorOptions = buildQueueTargetOptions(
    readQueueTargetChoices(dayBoardQuery.data, branch.departments)
  ).filter((option) => option.value.startsWith(NEXT_FREE_DOCTOR));

  function openNextPatient() {
    const nextEntry = waitingEntries.find(
      (entry) => entry.id !== chosenEntry?.id
    );
    setChosenEntryId(nextEntry?.id ?? null);
  }

  const columns: readonly DataTableColumn<QueueEntry>[] = [
    {
      key: "patient",
      label: "Patient",
      size: "wide",
      getCell: (entry) => ({
        kind: "text",
        primary: describePatientName(entry.patient),
        secondary: `${entry.token} · arrived ${describeBranchClockTime(entry.enqueuedAt)}${entry.id === chosenEntry?.id ? " · open now" : ""}`,
      }),
    },
    {
      key: "waiting",
      label: "Waiting",
      size: "compact",
      getCell: (entry) => ({
        kind: "status",
        ...describeClockTag(
          describeWait(entry.waitingMinutes, entry.waitState),
          entry.waitState
        ),
      }),
    },
  ];

  // The list across the page, then the open patient's form beneath it: side
  // by side, the list was too narrow for its columns.
  return (
    <div className="flex flex-col gap-6">
      <ContentPanel
        data-tour="triage-waiting"
        heading="Waiting for vital signs"
        headingLevel={2}
        description="Most urgent first, then by arrival. It updates on its own."
        spacing="compact"
      >
        <DataTable
          accessibleLabel="Waiting for vital signs"
          columns={columns}
          state={
            entriesQuery.isPending
              ? {
                  status: "loading",
                  label: "Loading patients waiting for vital signs",
                }
              : entriesQuery.isError
                ? {
                    status: "error",
                    title: "We could not load the patients waiting",
                    description: entriesQuery.error.message,
                    retryLabel: "Try again",
                    onRetry: () => void entriesQuery.refetch(),
                  }
                : { status: "ready", rows: waitingEntries }
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
              `Take vital signs for ${describePatientName(entry.patient)}`,
            onSelect: (entry) => setChosenEntryId(entry.id),
          }}
          emptyState={{
            illustration: <DocumentsCompleteIllustration />,
            title: "Nobody is waiting for vital signs",
            description:
              "Patients appear here as soon as the front desk checks them in.",
          }}
        />
      </ContentPanel>

      {chosenEntry ? (
        <VitalsForm
          key={chosenEntry.id}
          entry={chosenEntry}
          branchId={branch.id}
          doctorOptions={doctorOptions}
          defaultDoctorValue={
            findBookedDoctor(chosenEntry, dayBoardQuery.data) ??
            NEXT_FREE_DOCTOR
          }
          onFinished={openNextPatient}
        />
      ) : null}
    </div>
  );
}
