"use client";

import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { BranchSelectionNotice } from "~/features/branch-selection/components/branch-selection-notice";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** The workspace's first page: a welcome and the branch being worked at. */
export function WorkspaceOverview() {
  const { platformSession, organizationName, branchSelection } = useWorkspace();

  return (
    <>
      <div>
        <h1 className="font-serif text-title font-normal tracking-tight">
          Welcome, {platformSession.user.firstName}
        </h1>
        <p className="mt-2 text-lede text-muted-foreground">
          {branchSelection.status === "selected"
            ? `You are working at ${branchSelection.branch.name}, ${organizationName}.`
            : `${organizationName} is set up for HealthSchedule.`}
        </p>
      </div>
      {branchSelection.status === "selected" ? (
        <EmptyState
          surface="panel"
          illustration={<DocumentsCompleteIllustration />}
          title="Your workspace is ready"
          description="Scheduling tools will appear here as they become available to your organisation."
        />
      ) : (
        <BranchSelectionNotice branchSelection={branchSelection} />
      )}
    </>
  );
}
