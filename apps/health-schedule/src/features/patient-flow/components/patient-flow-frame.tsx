"use client";

import type { ReactNode } from "react";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { BranchSelectionNotice } from "~/features/branch-selection/components/branch-selection-notice";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/**
 * The heading, branch and permission check the front desk and queue boards
 * share. Patients are checked in and called at one branch at a time.
 */
export function PatientFlowFrame({
  title,
  description,
  requiredPermission,
  missingPermissionName,
  action,
  children,
}: {
  title: string;
  description: string;
  requiredPermission: string;
  /** The permission's name in role settings, for the notice. */
  missingPermissionName: string;
  /** The page's main actions, shown once the branch is chosen. */
  action?: ReactNode;
  children: (branch: WorkspaceBranch) => ReactNode;
}) {
  const { permissions, branchSelection } = useWorkspace();
  const hasPermission = permissions.includes(requiredPermission);
  const isReady = hasPermission && branchSelection.status === "selected";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-serif text-title font-normal tracking-tight">
            {title}
          </h1>
          <p className="text-body text-muted-foreground">
            {branchSelection.status === "selected"
              ? `${branchSelection.branch.name}. ${description}`
              : description}
          </p>
        </div>
        {isReady && action && <div data-tour="page-actions">{action}</div>}
      </div>
      {!hasPermission ? (
        <StateNotice tone="information" title="Your role cannot open this page">
          <p>
            Ask an organisation administrator to add the “
            {missingPermissionName}” permission to your role.
          </p>
        </StateNotice>
      ) : branchSelection.status === "selected" ? (
        children(branchSelection.branch)
      ) : (
        <BranchSelectionNotice branchSelection={branchSelection} />
      )}
    </div>
  );
}
