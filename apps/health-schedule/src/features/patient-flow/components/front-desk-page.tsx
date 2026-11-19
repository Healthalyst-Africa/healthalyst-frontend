"use client";

import { useState } from "react";
import {
  ExpectedArrivalsIcon,
  LongestWaitIcon,
  OverTargetIcon,
  RegisterPatientIcon,
  UnknownPatientIcon,
  WaitingPatientsIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { MetricSummary } from "@healthalyst/ui/components/metric-summary";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import {
  CheckInDialog,
  type CheckInCandidate,
} from "~/features/patient-flow/components/check-in-dialog";
import { PatientFlowFrame } from "~/features/patient-flow/components/patient-flow-frame";
import { RegisterPatientDialog } from "~/features/patient-flow/components/register-patient-dialog";
import { UnknownPatientDialog } from "~/features/patient-flow/components/unknown-patient-dialog";
import {
  CLOCK_STATE_TONES,
  PATIENT_FLOW_PERMISSIONS,
  PATIENT_SEARCH_CONFIGURATION,
  QUEUE_ENTRY_STATUS_PRESENTATION,
  TRIAGE_BAND_PRESENTATION,
} from "~/features/patient-flow/config/patient-flow";
import { useDebouncedValue } from "~/features/patient-flow/hooks/use-debounced-value";
import {
  useDayBoard,
  readPatientFlowDepartments,
  usePatientSearch,
  useQueueSummaries,
  useVisitBoard,
} from "~/features/patient-flow/hooks/use-patient-flow";
import type {
  OpenVisit,
  PatientMatch,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describeMinutes,
  describePatientMatch,
  describePatientMatchName,
  describePatientName,
  findExpectedArrival,
  listExpectedArrivals,
  readFlowEmphasis,
  sortByTriage,
  describeWait,
  summarizeFrontDesk,
  type ExpectedArrival,
} from "~/features/patient-flow/utilities/front-desk";
import {
  buildQueueTargetOptions,
  describeQueue,
  readQueueTargetChoices,
} from "~/features/patient-flow/utilities/queue-targets";
import { describeBranchClockTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** The receptionist's page: check patients in and see where everyone is. */
export function FrontDeskPage() {
  const { permissions } = useWorkspace();
  const canRegister = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.registerPatients
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisteringUnknown, setIsRegisteringUnknown] = useState(false);

  return (
    <PatientFlowFrame
      title="Front desk"
      description="Check patients in and see where everyone is."
      requiredPermission={PATIENT_FLOW_PERMISSIONS.checkIn}
      missingPermissionName="Check patients in and issue queue tokens"
      action={
        canRegister && (
          <div className="flex flex-wrap gap-2">
            <ActionButton
              type="button"
              variant="outline"
              leadingIcon={<UnknownPatientIcon className="size-4" />}
              onClick={() => setIsRegisteringUnknown(true)}
            >
              Unknown patient
            </ActionButton>
            <ActionButton
              type="button"
              leadingIcon={<RegisterPatientIcon className="size-4" />}
              onClick={() => setIsRegistering(true)}
            >
              Register a new patient
            </ActionButton>
          </div>
        )
      }
    >
      {(branch) => (
        <FrontDeskWorkspace
          branch={branch}
          isRegistering={isRegistering}
          setIsRegistering={setIsRegistering}
          isRegisteringUnknown={isRegisteringUnknown}
          setIsRegisteringUnknown={setIsRegisteringUnknown}
        />
      )}
    </PatientFlowFrame>
  );
}

function FrontDeskWorkspace({
  branch,
  isRegistering,
  setIsRegistering,
  isRegisteringUnknown,
  setIsRegisteringUnknown,
}: {
  branch: WorkspaceBranch;
  isRegistering: boolean;
  setIsRegistering: (isRegistering: boolean) => void;
  isRegisteringUnknown: boolean;
  setIsRegisteringUnknown: (isRegisteringUnknown: boolean) => void;
}) {
  const { permissions } = useWorkspace();
  const canReadQueues = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readQueues
  );
  const canReadAppointments = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readAppointments
  );
  const canSearchPatients = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readPatients
  );
  const canRegister = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.registerPatients
  );

  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(
    searchText.trim(),
    PATIENT_SEARCH_CONFIGURATION.delayMilliseconds
  );
  const isSearching =
    canSearchPatients &&
    debouncedSearchText.length >= PATIENT_SEARCH_CONFIGURATION.minimumLength;
  const [checkInCandidate, setCheckInCandidate] =
    useState<CheckInCandidate | null>(null);

  const dayBoardQuery = useDayBoard(branch.id, canReadAppointments);
  const visitBoardQuery = useVisitBoard(branch.id, canReadQueues);
  const queueSummariesQuery = useQueueSummaries(branch.id, canReadQueues);
  const searchQuery = usePatientSearch(debouncedSearchText, isSearching);

  const expectedArrivals = listExpectedArrivals(dayBoardQuery.data);
  const queueTargetOptions = buildQueueTargetOptions(
    readQueueTargetChoices(
      dayBoardQuery.data,
      readPatientFlowDepartments(branch)
    )
  );
  const figures = summarizeFrontDesk({
    queues: queueSummariesQuery.data ?? [],
    overVisitTarget: visitBoardQuery.data?.summary.overTarget ?? 0,
    dayBoard: dayBoardQuery.data,
  });

  function checkInExpectedArrival(appointment: ExpectedArrival) {
    setCheckInCandidate({
      arrival: { kind: "appointment", appointmentId: appointment.id },
      patientName: describePatientName(appointment.patient),
      details: `${appointment.patient.patientNumber} · Booked ${describeBranchClockTime(appointment.startsAt)} with ${appointment.resourceName} for ${appointment.appointmentTypeName}`,
    });
  }

  function checkInPatient(patient: PatientMatch) {
    const appointment = findExpectedArrival(expectedArrivals, patient.id);
    if (appointment) {
      checkInExpectedArrival(appointment);
      return;
    }
    setCheckInCandidate({
      arrival: { kind: "walk-in", patientId: patient.id },
      patientName: describePatientMatchName(patient),
      details: `${patient.patientNumber} · Walk-in, no appointment today`,
    });
  }

  const expectedArrivalColumns: readonly DataTableColumn<ExpectedArrival>[] = [
    {
      key: "time",
      label: "Time",
      size: "compact",
      getCell: (appointment) => ({
        kind: "text",
        primary: describeBranchClockTime(appointment.startsAt),
      }),
    },
    {
      key: "patient",
      label: "Patient",
      size: "wide",
      getCell: (appointment) => ({
        kind: "text",
        primary: describePatientName(appointment.patient),
        secondary: appointment.patient.patientNumber,
      }),
    },
    {
      key: "appointment",
      label: "Booked with",
      getCell: (appointment) => ({
        kind: "text",
        primary: appointment.resourceName,
        secondary: appointment.appointmentTypeName,
      }),
    },
  ];

  const searchColumns: readonly DataTableColumn<PatientMatch>[] = [
    {
      key: "patient",
      label: "Patient",
      size: "wide",
      getCell: (patient) => ({
        kind: "text",
        primary: describePatientMatchName(patient),
        secondary: describePatientMatch(patient),
      }),
    },
    {
      key: "number",
      label: "Patient number",
      getCell: (patient) => ({
        kind: "text",
        primary: patient.patientNumber,
        secondary: patient.folderNumber
          ? `Folder ${patient.folderNumber}`
          : undefined,
      }),
    },
    {
      key: "today",
      label: "Today",
      getCell: (patient) => {
        const appointment = findExpectedArrival(expectedArrivals, patient.id);
        return appointment
          ? {
              kind: "status",
              label: `Booked ${describeBranchClockTime(appointment.startsAt)}`,
              tone: "information",
            }
          : { kind: "status", label: "Walk-in", tone: "neutral" };
      },
    },
  ];

  const visitColumns: readonly DataTableColumn<OpenVisit>[] = [
    {
      key: "token",
      label: "Number",
      size: "compact",
      getCell: (visit) => ({
        kind: "text",
        primary: visit.token,
        secondary: visit.kind === "APPOINTMENT" ? "Booked" : "Walk-in",
      }),
    },
    {
      key: "patient",
      label: "Patient",
      size: "wide",
      getCell: (visit) => ({
        kind: "text",
        primary: describePatientName(visit.patient),
        secondary: visit.patient.patientNumber,
      }),
    },
    {
      key: "where",
      label: "Where now",
      getCell: (visit) =>
        visit.current
          ? {
              kind: "text",
              primary: describeQueue(visit.current),
              secondary:
                visit.current.status === "WAITING"
                  ? `Waiting ${describeWait(visit.current.minutes, visit.current.state)}`
                  : QUEUE_ENTRY_STATUS_PRESENTATION[visit.current.status].label,
            }
          : { kind: "text", primary: "Between queues" },
    },
    {
      key: "triage",
      label: "Triage",
      size: "compact",
      getCell: (visit) =>
        visit.triageBand
          ? { kind: "status", ...TRIAGE_BAND_PRESENTATION[visit.triageBand] }
          : { kind: "status", label: "Not yet", tone: "neutral" },
    },
    {
      key: "time",
      label: "Time here",
      size: "compact",
      getCell: (visit) => ({
        kind: "status",
        label: describeMinutes(visit.visitMinutes),
        tone: CLOCK_STATE_TONES[visit.visitState],
      }),
    },
  ];

  const registerAction = canRegister && (
    <ActionButton
      type="button"
      variant="outline"
      leadingIcon={<RegisterPatientIcon className="size-4" />}
      onClick={() => setIsRegistering(true)}
    >
      Register a new patient
    </ActionButton>
  );

  return (
    <div className="flex flex-col gap-8">
      {canReadQueues && (
        <MetricSummary
          isLoading={queueSummariesQuery.isPending || visitBoardQuery.isPending}
          items={[
            {
              label: "Waiting now",
              value: figures.waitingNow,
              icon: <WaitingPatientsIcon />,
            },
            {
              label: "Longest wait",
              value: describeMinutes(figures.longestWaitMinutes),
              icon: <LongestWaitIcon />,
            },
            {
              label: "Over the visit target",
              value: figures.overVisitTarget,
              icon: <OverTargetIcon />,
            },
            ...(canReadAppointments
              ? [
                  {
                    label: "Booked, not arrived",
                    value: figures.stillToArrive,
                    icon: <ExpectedArrivalsIcon />,
                  },
                ]
              : []),
          ]}
        />
      )}

      <ContentPanel
        heading="Check a patient in"
        headingLevel={2}
        description={
          canSearchPatients
            ? "Search by name, phone number, patient number or folder number. Names that sound alike are found too."
            : undefined
        }
      >
        {canSearchPatients ? (
          <SearchField
            aria-label="Search patients"
            placeholder="Name, phone, patient or folder number"
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
            autoComplete="off"
          />
        ) : (
          <StateNotice
            tone="information"
            title="Your role cannot search patients"
          >
            <p>
              Ask an organisation administrator to add the “Search patients”
              permission to check in walk-ins.
            </p>
          </StateNotice>
        )}
        {isSearching ? (
          <DataTable
            accessibleLabel={`Patients matching ${debouncedSearchText}`}
            columns={searchColumns}
            state={
              searchQuery.isPending
                ? { status: "loading", label: "Searching patients" }
                : searchQuery.isError
                  ? {
                      status: "error",
                      title: "We could not search for patients",
                      description: searchQuery.error.message,
                      retryLabel: "Try again",
                      onRetry: () => void searchQuery.refetch(),
                    }
                  : { status: "ready", rows: searchQuery.data }
            }
            getRowIdentifier={(patient) => patient.id}
            rowAction={{
              label: (patient) =>
                `Check in ${describePatientMatchName(patient)}`,
              onSelect: checkInPatient,
            }}
            emptyState={{
              illustration: <EmptySearchIllustration />,
              title: `No patient matches “${debouncedSearchText}”`,
              description: canRegister
                ? "Check the spelling or try a phone number. If they have never been here, register them."
                : "Check the spelling or try a phone number.",
              action: registerAction || undefined,
            }}
          />
        ) : canReadAppointments ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">
              Booked for today, not arrived
            </h3>
            <DataTable
              accessibleLabel="Booked for today, not arrived"
              columns={expectedArrivalColumns}
              state={
                dayBoardQuery.isPending
                  ? { status: "loading", label: "Loading today's appointments" }
                  : dayBoardQuery.isError
                    ? {
                        status: "error",
                        title: "We could not load today's appointments",
                        description: dayBoardQuery.error.message,
                        retryLabel: "Try again",
                        onRetry: () => void dayBoardQuery.refetch(),
                      }
                    : { status: "ready", rows: expectedArrivals }
              }
              getRowIdentifier={(appointment) => appointment.id}
              rowAction={{
                label: (appointment) =>
                  `Check in ${describePatientName(appointment.patient)}`,
                onSelect: checkInExpectedArrival,
              }}
              emptyState={{
                illustration: <EmptyReviewQueueIllustration />,
                title: "Everyone booked for today has arrived",
                description: "Search above to check in a walk-in.",
              }}
            />
          </div>
        ) : null}
      </ContentPanel>

      {canReadQueues && (
        <ContentPanel
          heading="In the building now"
          headingLevel={2}
          description="Everyone checked in and not yet finished: emergencies first, then urgent and routine patients, then those not yet triaged, the longest visits first within each. Emergencies are marked red; urgent patients and waits past the target are marked amber. It updates on its own."
        >
          <DataTable
            accessibleLabel="Patients in the building"
            columns={visitColumns}
            state={
              visitBoardQuery.isPending
                ? {
                    status: "loading",
                    label: "Loading patients in the building",
                  }
                : visitBoardQuery.isError
                  ? {
                      status: "error",
                      title: "We could not load the patients in the building",
                      description: visitBoardQuery.error.message,
                      retryLabel: "Try again",
                      onRetry: () => void visitBoardQuery.refetch(),
                    }
                  : {
                      status: "ready",
                      rows: sortByTriage(visitBoardQuery.data.data),
                    }
            }
            getRowIdentifier={(visit) => visit.visitId}
            getRowEmphasis={(visit) =>
              readFlowEmphasis({
                triageBand: visit.triageBand,
                waitState:
                  visit.current?.status === "WAITING"
                    ? visit.current.state
                    : null,
              })
            }
            emptyState={{
              illustration: <EmptyReviewQueueIllustration />,
              title: "Nobody is checked in",
              description:
                "Patients appear here as soon as they are checked in.",
            }}
          />
        </ContentPanel>
      )}

      <CheckInDialog
        candidate={checkInCandidate}
        onOpenChange={(open) => {
          if (!open) setCheckInCandidate(null);
        }}
        branchId={branch.id}
        queueTargetOptions={queueTargetOptions}
      />
      {canRegister && (
        <>
          <RegisterPatientDialog
            open={isRegistering}
            onOpenChange={setIsRegistering}
            initialName={searchText}
            onRegistered={(patient) => {
              setSearchText("");
              checkInPatient(patient);
            }}
          />
          <UnknownPatientDialog
            open={isRegisteringUnknown}
            onOpenChange={setIsRegisteringUnknown}
            onRegistered={checkInPatient}
          />
        </>
      )}
    </div>
  );
}
