"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DetailList } from "@healthalyst/ui/components/detail-list";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import { NotesSection } from "~/features/clinical-record/components/notes-section";
import { ProblemsSection } from "~/features/clinical-record/components/problems-section";
import {
  CONSULTATION_PERMISSIONS,
  SHARED_DOCTORS_QUEUE_VALUE,
} from "~/features/consultation/config/consultation";
import {
  describeVitalSigns,
  findOwnCalendar,
} from "~/features/consultation/utilities/consultation-rules";
import { PatientFlowFrame } from "~/features/patient-flow/components/patient-flow-frame";
import { SendOnDialog } from "~/features/patient-flow/components/send-on-dialog";
import {
  PATIENT_FLOW_PERMISSIONS,
  QUEUE_ENTRY_STATUS_PRESENTATION,
  TRIAGE_BAND_PRESENTATION,
} from "~/features/patient-flow/config/patient-flow";
import {
  useDayBoard,
  useQueueActions,
  useQueueEntries,
  useTriageHistory,
} from "~/features/patient-flow/hooks/use-patient-flow";
import type { QueueEntry } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describePatientName,
  describeWait,
} from "~/features/patient-flow/utilities/front-desk";
import {
  buildQueueTargetOptions,
  decodeQueueTarget,
  encodeQueueTarget,
  readQueueTargetChoices,
} from "~/features/patient-flow/utilities/queue-targets";
import { AllergiesSection } from "~/features/patients/components/allergies-section";
import { PatientBanner } from "~/features/patients/components/patient-banner";
import { usePatientDetail } from "~/features/patients/hooks/use-patients";
import { useScheduleCalendars } from "~/features/schedule-setup/hooks/use-schedule-setup";
import { RecordAccessGate } from "~/features/sensitive-records/components/record-access-gate";
import { describeBranchClockTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** The visit's latest triage: band, complaint and vital signs. */
function TriageSummary({ visitId }: { visitId: string }) {
  const triageQuery = useTriageHistory(visitId, true);
  const latest = triageQuery.data?.[0];

  return (
    <ContentPanel heading="Triage" headingLevel={2}>
      {triageQuery.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading vital signs
        </p>
      )}
      {triageQuery.isError && (
        <NoticeBanner tone="error" title="We could not load the vital signs">
          {triageQuery.error.message}
        </NoticeBanner>
      )}
      {triageQuery.isSuccess && !latest && (
        <p className="text-sm text-muted-foreground">
          Vital signs were not taken on this visit.
        </p>
      )}
      {latest && (
        <div className="flex flex-col gap-4">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <StatusLabel tone={TRIAGE_BAND_PRESENTATION[latest.band].tone}>
              {TRIAGE_BAND_PRESENTATION[latest.band].label}
            </StatusLabel>
            <span className="text-muted-foreground">
              Recorded {describeBranchClockTime(latest.recordedAt)}
            </span>
          </p>
          <DetailList
            items={[
              ...(latest.complaint
                ? [{ term: "Complaint", description: latest.complaint }]
                : []),
              ...describeVitalSigns(latest),
              ...(latest.notes
                ? [{ term: "Nurse's notes", description: latest.notes }]
                : []),
            ]}
          />
        </div>
      )}
    </ContentPanel>
  );
}

/** One patient being seen: their record's essentials, note and diagnoses. */
function PatientWorkspace({
  entry,
  branch,
  sendOnOptions,
}: {
  entry: QueueEntry;
  branch: WorkspaceBranch;
  sendOnOptions: ReturnType<typeof buildQueueTargetOptions>;
}) {
  const { permissions } = useWorkspace();
  const canManageQueue = permissions.includes(
    CONSULTATION_PERMISSIONS.manageQueues
  );
  const patientQuery = usePatientDetail(entry.patient.id);
  const actions = useQueueActions(branch.id);
  const [isSendingOn, setIsSendingOn] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const isWithDoctor = entry.status === "IN_SERVICE";

  const queueActions = canManageQueue && (
    <div className="flex flex-wrap gap-2">
      {!isWithDoctor && (
        <ActionButton
          type="button"
          isLoading={actions.start.isPending}
          loadingText="Starting"
          onClick={() =>
            actions.start.mutate(entry.id, {
              onSuccess: (updatedEntry) =>
                announceSuccess(
                  `${describePatientName(updatedEntry.patient)} is with you`
                ),
            })
          }
        >
          Start consultation
        </ActionButton>
      )}
      <ActionButton
        type="button"
        variant="outline"
        onClick={() => {
          actions.sendOn.reset();
          setIsSendingOn(true);
        }}
      >
        Send on
      </ActionButton>
      {isWithDoctor && (
        <ActionButton
          type="button"
          variant="outline"
          onClick={() => {
            actions.finish.reset();
            setIsFinishing(true);
          }}
        >
          Finish visit
        </ActionButton>
      )}
    </div>
  );

  if (patientQuery.isPending) {
    return (
      <LoadingPlaceholder
        label="Opening the patient's record"
        rows={[{ shape: "card" }, { shape: "card" }]}
      />
    );
  }
  if (patientQuery.isError) {
    return (
      <StateNotice
        tone="error"
        title="We could not open this patient's record"
        action={
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => void patientQuery.refetch()}
          >
            Try again
          </ActionButton>
        }
      >
        <p>{patientQuery.error.message}</p>
      </StateNotice>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PatientBanner patient={patientQuery.data} actions={queueActions} />
      {(actions.start.isError || actions.finish.isError) && (
        <NoticeBanner tone="error" title="The queue was not updated">
          {actions.start.error?.message ?? actions.finish.error?.message}
        </NoticeBanner>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <RecordAccessGate patientId={entry.patient.id}>
            <section
              className="flex flex-col gap-3"
              aria-labelledby="consultation-note-heading"
            >
              <h2
                id="consultation-note-heading"
                className="font-serif text-xl font-normal"
              >
                Consultation note
              </h2>
              <NotesSection
                patientId={entry.patient.id}
                visitId={entry.visitId}
                newNoteType="CONSULTATION"
              />
            </section>
            <ProblemsSection
              patientId={entry.patient.id}
              visitId={entry.visitId}
            />
          </RecordAccessGate>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <TriageSummary visitId={entry.visitId} />
          <AllergiesSection patientId={entry.patient.id} />
          <Link
            href={HEALTH_SCHEDULE_ROUTES.patient(entry.patient.id)}
            className="w-fit text-sm font-medium text-primary underline underline-offset-4"
          >
            Open the full record
          </Link>
        </div>
      </div>
      <SendOnDialog
        entry={isSendingOn ? entry : null}
        onOpenChange={setIsSendingOn}
        queueTargetOptions={sendOnOptions}
        isSubmitting={actions.sendOn.isPending}
        error={actions.sendOn.error}
        onSubmit={(request) =>
          actions.sendOn.mutate(
            { entryId: entry.id, request },
            {
              onSuccess: () => {
                announceSuccess(
                  `${describePatientName(entry.patient)} sent on`
                );
                setIsSendingOn(false);
              },
            }
          )
        }
      />
      <FormDialog
        open={isFinishing}
        onOpenChange={setIsFinishing}
        title={`Finish ${describePatientName(entry.patient)}'s visit?`}
        description="The visit ends and the appointment is completed. Sign your note first: drafts stay visible only to you."
        submitLabel="Finish visit"
        submittingLabel="Finishing"
        isSubmitting={actions.finish.isPending}
        error={actions.finish.error?.message}
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          actions.finish.mutate(entry.visitId, {
            onSuccess: () => {
              announceSuccess("Visit finished");
              setIsFinishing(false);
            },
          });
        }}
      >
        {null}
      </FormDialog>
    </div>
  );
}

function ConsultationBoard({ branch }: { branch: WorkspaceBranch }) {
  const { platformSession, permissions } = useWorkspace();
  const canReadAppointments = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readAppointments
  );
  const canManageQueue = permissions.includes(
    CONSULTATION_PERMISSIONS.manageQueues
  );
  const dayBoardQuery = useDayBoard(branch.id, canReadAppointments);
  const calendarsQuery = useScheduleCalendars();
  const membershipId =
    platformSession.memberships.find(
      (membership) =>
        membership.organization.id ===
        platformSession.activeContext.organizationId
    )?.membershipId ?? null;
  const ownCalendar = findOwnCalendar(calendarsQuery.data ?? [], membershipId);
  const choices = readQueueTargetChoices(
    dayBoardQuery.data,
    branch.departments
  );
  const doctorOptions = useMemo(
    () =>
      buildQueueTargetOptions(choices).filter((option) =>
        option.value.startsWith(SHARED_DOCTORS_QUEUE_VALUE)
      ),
    [choices]
  );
  const [queueValue, setQueueValue] = useState<string | null>(null);
  // Open on the doctor's own queue once their calendar is known.
  const chosenQueueValue =
    queueValue ??
    (ownCalendar
      ? encodeQueueTarget({ kind: "CONSULTATION", resourceId: ownCalendar.id })
      : SHARED_DOCTORS_QUEUE_VALUE);
  const queue = decodeQueueTarget(chosenQueueValue) ?? {
    kind: "CONSULTATION" as const,
  };
  const entriesQuery = useQueueEntries(branch.id, queue, true);
  const actions = useQueueActions(branch.id);
  const [selectedEntryIdentifier, setSelectedEntryIdentifier] = useState<
    string | null
  >(null);
  const entries = entriesQuery.data ?? [];
  const selectedEntry =
    entries.find((entry) => entry.id === selectedEntryIdentifier) ?? null;

  // Someone finished or sent on leaves the queue: let go of them.
  useEffect(() => {
    if (selectedEntryIdentifier && entriesQuery.isSuccess && !selectedEntry) {
      setSelectedEntryIdentifier(null);
    }
  }, [entriesQuery.isSuccess, selectedEntry, selectedEntryIdentifier]);

  const queueOptions = [
    ...(ownCalendar
      ? [
          {
            value: encodeQueueTarget({
              kind: "CONSULTATION",
              resourceId: ownCalendar.id,
            }),
            label: "My queue",
          },
        ]
      : []),
    ...doctorOptions.filter(
      (option) =>
        !ownCalendar ||
        option.value !==
          encodeQueueTarget({
            kind: "CONSULTATION",
            resourceId: ownCalendar.id,
          })
    ),
  ];
  const sendOnOptions = buildQueueTargetOptions(choices).filter(
    (option) => option.value !== chosenQueueValue
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside
        data-tour="consultation-queue"
        className="flex flex-col gap-4"
        aria-labelledby="consultation-queue-heading"
      >
        <h2 id="consultation-queue-heading" className="sr-only">
          Patients waiting
        </h2>
        <SelectField
          id="consultation-queue"
          label="Queue"
          description={
            !calendarsQuery.isSuccess
              ? undefined
              : ownCalendar
                ? "My queue holds patients booked with you or sent to you. Next free doctor holds patients any doctor can see."
                : "You have no calendar of your own, so you see patients waiting for any doctor."
          }
          placeholder="Choose a queue"
          options={queueOptions}
          value={chosenQueueValue}
          onValueChange={(value) => {
            setQueueValue(value);
            setSelectedEntryIdentifier(null);
          }}
        />
        {canManageQueue && (
          <ActionButton
            data-tour="consultation-call-next"
            type="button"
            variant="outline"
            isLoading={actions.callNext.isPending}
            loadingText="Calling"
            disabled={!entries.some((entry) => entry.status === "WAITING")}
            onClick={() =>
              actions.callNext.mutate(queue, {
                onSuccess: (entry) => {
                  setSelectedEntryIdentifier(entry.id);
                  announceSuccess(
                    `Calling ${entry.token}, ${describePatientName(entry.patient)}`
                  );
                },
              })
            }
          >
            Call next patient
          </ActionButton>
        )}
        {actions.callNext.isError && (
          <NoticeBanner tone="error" title="Nobody was called">
            {actions.callNext.error.message}
          </NoticeBanner>
        )}
        {entriesQuery.isPending ? (
          <LoadingPlaceholder
            label="Loading the queue"
            rows={[{ shape: "card" }]}
          />
        ) : entriesQuery.isError ? (
          <NoticeBanner tone="error" title="We could not load the queue">
            {entriesQuery.error.message}
          </NoticeBanner>
        ) : entries.length === 0 ? (
          <EmptyState
            surface="panel"
            illustration={<DocumentsCompleteIllustration />}
            title="Nobody is waiting"
            description="Patients appear here when the nurse sends them to a doctor after their vital signs."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => {
              const status =
                entry.status in QUEUE_ENTRY_STATUS_PRESENTATION
                  ? QUEUE_ENTRY_STATUS_PRESENTATION[
                      entry.status as keyof typeof QUEUE_ENTRY_STATUS_PRESENTATION
                    ]
                  : null;
              const band = entry.triageBand
                ? TRIAGE_BAND_PRESENTATION[entry.triageBand]
                : null;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-current={
                      entry.id === selectedEntryIdentifier ? "true" : undefined
                    }
                    onClick={() => setSelectedEntryIdentifier(entry.id)}
                    className="flex w-full flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-[current=true]:border-primary aria-[current=true]:bg-accent"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {describePatientName(entry.patient)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.token}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {band && (
                        <StatusLabel tone={band.tone}>{band.label}</StatusLabel>
                      )}
                      {status && (
                        <StatusLabel tone={status.tone}>
                          {status.label}
                        </StatusLabel>
                      )}
                      <span>
                        {describeWait(entry.waitingMinutes, entry.waitState)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <section
        data-tour="consultation-patient"
        aria-label="Patient being seen"
        className="min-w-0"
      >
        {selectedEntry ? (
          <PatientWorkspace
            key={selectedEntry.id}
            entry={selectedEntry}
            branch={branch}
            sendOnOptions={sendOnOptions}
          />
        ) : (
          <EmptyState
            surface="panel"
            illustration={<EmptyReviewQueueIllustration />}
            title="Choose a patient"
            description={
              canManageQueue
                ? "Call the next patient, or choose one from the queue, to see their vital signs and allergies and write the note for their visit."
                : "Choose a patient from the queue to see their vital signs, notes and diagnoses."
            }
          />
        )}
      </section>
    </div>
  );
}

/**
 * The doctor's workspace: their queue beside the patient being seen, with
 * triage, allergies, the consultation note and diagnoses for the visit.
 */
export function ConsultationPage() {
  const { permissions } = useWorkspace();
  if (!permissions.includes(CONSULTATION_PERMISSIONS.writeNotes)) {
    return (
      <StateNotice
        tone="information"
        title="Your role cannot write consultation notes"
      >
        <p>
          Consultations are for doctors. Ask an organisation administrator to
          add the “Write and sign doctors’ notes” permission to your role if you
          need it.
        </p>
      </StateNotice>
    );
  }
  return (
    <PatientFlowFrame
      title="Consultation"
      description="See patients waiting for a doctor one at a time: read their vital signs and allergies, write the note for the visit and record diagnoses."
      requiredPermission={CONSULTATION_PERMISSIONS.readQueues}
      missingPermissionName="View queues and patient flow"
    >
      {(branch) => <ConsultationBoard branch={branch} />}
    </PatientFlowFrame>
  );
}
