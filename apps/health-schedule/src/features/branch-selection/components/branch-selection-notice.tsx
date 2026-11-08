"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { BranchPicker } from "~/features/branch-selection/components/branch-picker";
import type { BranchSelection } from "~/features/branch-selection/hooks/use-branch-selection";

/** Why the workspace cannot open a branch yet, and how to continue. */
export function BranchSelectionNotice({
  branchSelection,
}: {
  branchSelection: Exclude<BranchSelection, { status: "selected" }>;
}) {
  switch (branchSelection.status) {
    case "loading":
      return (
        <LoadingPlaceholder
          label="Loading your branches"
          rows={[{ shape: "card" }]}
        />
      );
    case "failed":
      return (
        <StateNotice
          tone="error"
          title="We could not load your branches"
          action={
            <ActionButton type="button" onClick={branchSelection.retry}>
              Try again
            </ActionButton>
          }
        >
          <p>{branchSelection.message}</p>
        </StateNotice>
      );
    case "permission-missing":
      return (
        <StateNotice tone="warning" title="Your role cannot see branches">
          <p>
            HealthSchedule works one branch at a time. Ask an organisation
            administrator to add the “View branches” permission to your role.
          </p>
        </StateNotice>
      );
    case "no-branches":
      return (
        <StateNotice tone="warning" title="No branch is open to you">
          <p>
            Ask an organisation administrator to add you to a branch, or to
            reopen a closed branch in organisation settings.
          </p>
        </StateNotice>
      );
    case "choosing":
      return (
        <StateNotice
          tone="information"
          title="Choose the branch you are working at"
          action={<BranchPicker branchSelection={branchSelection} />}
        >
          <p>
            Patients, appointments and queues are kept per branch. You can
            change branch at any time from the top of the page.
          </p>
        </StateNotice>
      );
  }
}
