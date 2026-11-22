"use client";

import Link from "next/link";
import { SetupChecklist } from "@healthalyst/ui/components/setup-checklist";
import {
  WorkCardGrid,
  type WorkCard,
} from "@healthalyst/ui/components/work-card-grid";
import { EntranceIllustration } from "@healthalyst/ui/illustrations/entrance-illustration";
import { HeartPulseIllustration } from "@healthalyst/ui/illustrations/heart-pulse-illustration";
import { PersonSearchIllustration } from "@healthalyst/ui/illustrations/person-search-illustration";
import { RestrictedRecordIllustration } from "@healthalyst/ui/illustrations/restricted-record-illustration";
import { StethoscopeIllustration } from "@healthalyst/ui/illustrations/stethoscope-illustration";
import { WaitingLineIllustration } from "@healthalyst/ui/illustrations/waiting-line-illustration";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { BranchSelectionNotice } from "~/features/branch-selection/components/branch-selection-notice";
import { TourOffer } from "~/features/guided-tours/components/tour-offer";
import { PATIENT_FLOW_PERMISSIONS } from "~/features/patient-flow/config/patient-flow";
import {
  useDayBoard,
  useQueueSummaries,
  useVisitBoard,
} from "~/features/patient-flow/hooks/use-patient-flow";
import {
  buildSetupSteps,
  countPatients,
  countWaiting,
} from "~/features/product-access/utilities/todays-work";
import { SCHEDULE_PERMISSIONS } from "~/features/schedule-setup/config/schedule-setup";
import {
  useAppointmentTypes,
  useScheduleCalendars,
} from "~/features/schedule-setup/hooks/use-schedule-setup";
import { SENSITIVE_RECORD_PERMISSIONS } from "~/features/sensitive-records/config/sensitive-records";
import { useEmergencyAccessGrants } from "~/features/sensitive-records/hooks/use-sensitive-records";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** Doctors see patients in the consultation workspace. */
const CONSULTATION_PERMISSION = "note:write";
const TRIAGE_PERMISSION = "triage:record";

/**
 * The first page: what needs doing today, one card per job the person's
 * role allows, and, for people who manage the schedule, what is left to set
 * up before patients can be booked.
 */
export function WorkspaceOverview() {
  const { platformSession, permissions, branchSelection } = useWorkspace();
  const can = (permission: string) => permissions.includes(permission);
  const branch =
    branchSelection.status === "selected" ? branchSelection.branch : null;
  const branchIdentifier = branch?.id ?? "";

  const canCheckIn = can(PATIENT_FLOW_PERMISSIONS.checkIn);
  const canReadQueues = can(PATIENT_FLOW_PERMISSIONS.readQueues);
  const canManageSchedule = can(SCHEDULE_PERMISSIONS.manage);
  const canReviewAccess = can(SENSITIVE_RECORD_PERMISSIONS.reviewAccess);

  const dayBoardQuery = useDayBoard(
    branchIdentifier,
    branch !== null &&
      canCheckIn &&
      can(PATIENT_FLOW_PERMISSIONS.readAppointments)
  );
  const visitBoardQuery = useVisitBoard(
    branchIdentifier,
    branch !== null && canCheckIn && canReadQueues
  );
  const queueSummariesQuery = useQueueSummaries(
    branchIdentifier,
    branch !== null && canReadQueues
  );
  const accessGrantsQuery = useEmergencyAccessGrants(true, canReviewAccess);
  const calendarsQuery = useScheduleCalendars();
  const appointmentTypesQuery = useAppointmentTypes();

  const queues = queueSummariesQuery.data;
  const triageWaiting = countWaiting(queues, "TRIAGE");
  const doctorWaiting = countWaiting(queues, "CONSULTATION");
  const departmentWaiting = countWaiting(queues, "DEPARTMENT");
  const queuesLoading = queueSummariesQuery.isPending;

  const workCards: WorkCard[] = [];
  if (canCheckIn) {
    const stillToArrive = dayBoardQuery.data?.summary.booked ?? 0;
    const inBuilding = visitBoardQuery.data?.summary.open ?? 0;
    workCards.push({
      title: "Check patients in",
      status: `${stillToArrive === 0 ? "No bookings left today" : `${countPatients(stillToArrive)} booked, not here yet`} · ${inBuilding === 0 ? "nobody in the building" : `${inBuilding} in the building`}`,
      href: HEALTH_SCHEDULE_ROUTES.frontDesk,
      illustration: <EntranceIllustration />,
      isLoading: dayBoardQuery.isPending || visitBoardQuery.isPending,
    });
  }
  if (can(TRIAGE_PERMISSION)) {
    workCards.push({
      title: "Take vital signs",
      status:
        triageWaiting === 0
          ? "Nobody waiting"
          : `${countPatients(triageWaiting)} waiting`,
      href: HEALTH_SCHEDULE_ROUTES.triage,
      illustration: <HeartPulseIllustration />,
      needsAttention: triageWaiting > 0,
      isLoading: queuesLoading,
    });
  }
  if (can(CONSULTATION_PERMISSION) && canReadQueues) {
    workCards.push({
      title: "See patients",
      status:
        doctorWaiting === 0
          ? "Nobody waiting for a doctor"
          : `${countPatients(doctorWaiting)} waiting for a doctor`,
      href: HEALTH_SCHEDULE_ROUTES.consultation,
      illustration: <StethoscopeIllustration />,
      needsAttention: doctorWaiting > 0,
      isLoading: queuesLoading,
    });
  }
  if (canReadQueues) {
    workCards.push({
      title: "Serve a department",
      status:
        departmentWaiting === 0
          ? "Nobody waiting in a department"
          : `${countPatients(departmentWaiting)} waiting in departments`,
      href: HEALTH_SCHEDULE_ROUTES.queues,
      illustration: <WaitingLineIllustration />,
      needsAttention: departmentWaiting > 0,
      isLoading: queuesLoading,
    });
  }
  if (can(PATIENT_FLOW_PERMISSIONS.readPatients)) {
    workCards.push({
      title: "Find a patient",
      status: "Search records by name, phone or number",
      href: HEALTH_SCHEDULE_ROUTES.patients,
      illustration: <PersonSearchIllustration />,
    });
  }
  if (canReviewAccess) {
    const unreviewed = accessGrantsQuery.data?.length ?? 0;
    workCards.push({
      title: "Check emergency openings",
      status:
        unreviewed === 0
          ? "Nothing to check"
          : `${unreviewed} restricted ${unreviewed === 1 ? "record" : "records"} opened in an emergency`,
      href: HEALTH_SCHEDULE_ROUTES.accessReviews,
      illustration: <RestrictedRecordIllustration />,
      needsAttention: unreviewed > 0,
      isLoading: accessGrantsQuery.isPending,
    });
  }

  const setupSteps = buildSetupSteps({
    calendars: calendarsQuery.data ?? [],
    appointmentTypes: appointmentTypesQuery.data ?? [],
  });
  const setupLoading =
    calendarsQuery.isPending || appointmentTypesQuery.isPending;
  const isSetupComplete = setupSteps.every((step) => step.isComplete);
  const showsSetup =
    canManageSchedule &&
    !calendarsQuery.isError &&
    !appointmentTypesQuery.isError &&
    (setupLoading || !isSetupComplete);

  return (
    <>
      <div>
        <h1 className="font-serif text-title font-normal tracking-tight">
          Welcome, {platformSession.user.firstName}
        </h1>
        <p className="mt-2 text-lede text-muted-foreground">
          {branch
            ? `Here is today at ${branch.name}.`
            : "Choose the branch you work at to see today's patients."}
        </p>
      </div>
      <TourOffer />
      {branchSelection.status !== "selected" && (
        <BranchSelectionNotice branchSelection={branchSelection} />
      )}
      {showsSetup && (
        <SetupChecklist
          heading="Before you see patients"
          steps={setupSteps}
          isLoading={setupLoading}
          linkComponent={Link}
        />
      )}
      {branch && workCards.length > 0 && (
        <section
          aria-labelledby="todays-work-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="todays-work-heading"
            className="font-serif text-lg font-normal leading-snug"
          >
            Your work today
          </h2>
          <WorkCardGrid cards={workCards} linkComponent={Link} />
        </section>
      )}
    </>
  );
}
