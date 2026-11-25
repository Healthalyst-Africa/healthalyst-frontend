"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FinishVisitIcon,
  WaitTimeIcon,
  PatientRecordsIcon,
  SendOnIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ActionMenu } from "@healthalyst/ui/components/action-menu";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { ReadingGrid } from "@healthalyst/ui/components/reading-grid";
import { RecordTabs } from "@healthalyst/ui/components/record-tabs";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import {
  PatientQueueList,
  type PatientQueueFact,
} from "@healthalyst/ui/components/patient-queue-list";
import { ScrollRegion } from "@healthalyst/ui/components/scroll-region";
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
  describeMinutes,
  describePatientName,
  describeQueueStatusTag,
  describeWait,
} from "~/features/patient-flow/utilities/front-desk";
import {
  buildQueueTargetOptions,
  decodeQueueTarget,
  encodeQueueTarget,
  readQueueTargetChoices,
} from "~/features/patient-flow/utilities/queue-targets";
import { OrderTestsPanel } from "~/features/orders/components/order-tests-panel";
import { PatientOrdersSection } from "~/features/orders/components/patient-orders-section";
import {
  ORDER_PERMISSIONS,
  RESULTS_READY_TAG,
} from "~/features/orders/config/orders";
import { useResultsInbox } from "~/features/orders/hooks/use-orders";
import { readPatientsWithResults } from "~/features/orders/utilities/order-rules";
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
            <StatusLabel {...TRIAGE_BAND_PRESENTATION[latest.band]} />
            <span className="text-muted-foreground">
              Recorded {describeBranchClockTime(latest.recordedAt)}
            </span>
          </p>
          {latest.complaint && (
            <p className="text-sm">
              <span className="font-medium">Complaint: </span>
              {latest.complaint}
            </p>
          )}
          <ReadingGrid
            readings={describeVitalSigns(latest).map((vitalSign) => ({
              label: vitalSign.term,
              value: vitalSign.description,
            }))}
          />
          {latest.notes && (
            <p className="text-sm">
              <span className="font-medium">Nurse&apos;s notes: </span>
              {latest.notes}
            </p>
          )}
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
  const router = useRouter();
  const canManageQueue = permissions.includes(
    CONSULTATION_PERMISSIONS.manageQueues
  );
  const canOrder = permissions.includes(ORDER_PERMISSIONS.create);
  const canReadResults = permissions.includes(ORDER_PERMISSIONS.readResults);
  const patientQuery = usePatientDetail(entry.patient.id);
  const actions = useQueueActions(branch.id);
  const [isSendingOn, setIsSendingOn] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [section, setSection] = useState("note");
  const isWithDoctor = entry.status === "IN_SERVICE";

  const queueActions = (
    <div className="flex flex-wrap items-center gap-2">
      {canManageQueue && !isWithDoctor && (
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
      <ActionMenu
        accessibleLabel={`More for ${describePatientName(entry.patient)}`}
        items={[
          ...(canManageQueue
            ? [
                {
                  label: "Send on",
                  icon: <SendOnIcon />,
                  onSelect: () => {
                    actions.sendOn.reset();
                    setIsSendingOn(true);
                  },
                },
                ...(isWithDoctor
                  ? [
                      {
                        label: "Finish visit",
                        icon: <FinishVisitIcon />,
                        onSelect: () => {
                          actions.finish.reset();
                          setIsFinishing(true);
                        },
                      },
                    ]
                  : []),
              ]
            : []),
          {
            label: "Open full record",
            icon: <PatientRecordsIcon />,
            separatedAbove: canManageQueue,
            onSelect: () =>
              router.push(HEALTH_SCHEDULE_ROUTES.patient(entry.patient.id)),
          },
        ]}
      />
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
      <TriageSummary visitId={entry.visitId} />
      <RecordTabs
        accessibleLabel={`${describePatientName(entry.patient)}'s consultation`}
        value={section}
        onValueChange={setSection}
        tabs={[
          {
            value: "note",
            label: "Note",
            content: (
              <RecordAccessGate patientId={entry.patient.id}>
                <h2 className="sr-only">Consultation note</h2>
                <NotesSection
                  patientId={entry.patient.id}
                  visitId={entry.visitId}
                  newNoteType="CONSULTATION"
                />
              </RecordAccessGate>
            ),
          },
          {
            value: "diagnoses",
            label: "Diagnoses",
            content: (
              <RecordAccessGate patientId={entry.patient.id}>
                <ProblemsSection
                  patientId={entry.patient.id}
                  visitId={entry.visitId}
                />
              </RecordAccessGate>
            ),
          },
          ...(canOrder || canReadResults
            ? [
                {
                  value: "tests",
                  label: "Tests and results",
                  content: (
                    <RecordAccessGate patientId={entry.patient.id}>
                      <div className="flex flex-col gap-6">
                        {canOrder && (
                          <OrderTestsPanel
                            patientId={entry.patient.id}
                            visitId={entry.visitId}
                          />
                        )}
                        {canReadResults && (
                          <PatientOrdersSection patientId={entry.patient.id} />
                        )}
                      </div>
                    </RecordAccessGate>
                  ),
                },
              ]
            : []),
          {
            value: "allergies",
            label: "Allergies",
            content: <AllergiesSection patientId={entry.patient.id} />,
          },
        ]}
      />
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
  const resultsInboxQuery = useResultsInbox(
    permissions.includes(ORDER_PERMISSIONS.create)
  );
  const patientsWithResults = readPatientsWithResults(
    resultsInboxQuery.data ?? []
  );
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
    <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
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
          <ScrollRegion accessibleLabel="Patients waiting" size="large">
            <PatientQueueList
              currentIdentifier={selectedEntryIdentifier}
              onSelect={setSelectedEntryIdentifier}
              items={entries.map((entry) => ({
                id: entry.id,
                name: describePatientName(entry.patient),
                reference: entry.token,
                facts: describeQueueFacts(
                  entry,
                  patientsWithResults.has(entry.patient.id)
                ),
              }))}
            />
          </ScrollRegion>
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

/**
 * A waiting patient's urgency, where they are and whether results are back
 * as icons, then how long they have waited, which sits at the end of the line.
 */
function describeQueueFacts(
  entry: QueueEntry,
  hasResults: boolean
): PatientQueueFact[] {
  return [
    ...(entry.triageBand ? [TRIAGE_BAND_PRESENTATION[entry.triageBand]] : []),
    describeQueueStatusTag(entry.status),
    ...(hasResults ? [RESULTS_READY_TAG] : []),
    {
      icon: WaitTimeIcon,
      label: `Waiting ${describeWait(entry.waitingMinutes, entry.waitState)}`,
      value: describeMinutes(entry.waitingMinutes),
      tone: entry.waitState === "RED" ? ("negative" as const) : undefined,
    },
  ];
}

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
      description="See patients waiting for a doctor one at a time: read their vital signs and allergies, write the note for the visit, record diagnoses and order tests and scans."
      requiredPermission={CONSULTATION_PERMISSIONS.readQueues}
      missingPermissionName="View queues and patient flow"
    >
      {(branch) => <ConsultationBoard branch={branch} />}
    </PatientFlowFrame>
  );
}
