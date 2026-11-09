"use client";

import { ToolbarSelect } from "@healthalyst/ui/components/toolbar-select";
import type { BranchSelection } from "~/features/branch-selection/hooks/use-branch-selection";

type ChoosableBranchSelection = Extract<
  BranchSelection,
  { status: "choosing" | "selected" }
>;

/** The branch the person is working at, and the other branches they may choose. */
export function BranchPicker({
  branchSelection,
  align,
}: {
  branchSelection: ChoosableBranchSelection;
  align?: "start" | "end";
}) {
  return (
    <ToolbarSelect
      label="Branch"
      placeholder="Choose a branch"
      value={
        branchSelection.status === "selected" ? branchSelection.branch.id : null
      }
      options={branchSelection.branchOptions.map((branch) => ({
        value: branch.id,
        label: branch.name,
      }))}
      onValueChange={branchSelection.selectBranch}
      align={align}
    />
  );
}
