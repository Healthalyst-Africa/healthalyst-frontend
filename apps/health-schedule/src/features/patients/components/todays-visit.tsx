"use client";

import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { VisitProgress } from "@healthalyst/ui/components/visit-progress";
import { PATIENT_FLOW_PERMISSIONS } from "~/features/patient-flow/config/patient-flow";
import { useVisitBoard } from "~/features/patient-flow/hooks/use-patient-flow";
import { describeVisitProgress } from "~/features/patient-flow/utilities/visit-progress";
import { describeBranchClockTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/**
 * Where the patient is today, when they are in the building: shown above the
 * record so anyone who opens it sees their visit first.
 */
export function TodaysVisit({ patientId }: { patientId: string }) {
  const { permissions, branchSelection } = useWorkspace();
  const branch =
    branchSelection.status === "selected" ? branchSelection.branch : null;
  const visitBoardQuery = useVisitBoard(
    branch?.id ?? "",
    branch !== null && permissions.includes(PATIENT_FLOW_PERMISSIONS.readQueues)
  );
  const visit = visitBoardQuery.data?.data.find(
    (openVisit) => openVisit.patient.id === patientId
  );
  if (!visit || !branch) return null;

  return (
    <ContentPanel
      heading={`Here today at ${branch.name}`}
      headingLevel={2}
      description={`Checked in at ${describeBranchClockTime(visit.checkedInAt)}, number ${visit.token}.`}
      spacing="compact"
    >
      <VisitProgress steps={describeVisitProgress(visit)} />
    </ContentPanel>
  );
}
