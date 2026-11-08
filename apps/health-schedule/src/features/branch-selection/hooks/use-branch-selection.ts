"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import { BRANCH_READ_PERMISSION } from "~/features/branch-selection/config/branch-selection";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import {
  BRANCH_SELECTION_QUERY_KEYS,
  getWorkspaceBranches,
} from "~/features/branch-selection/services/branch-service";
import {
  readRememberedBranch,
  rememberBranch,
} from "~/features/branch-selection/utilities/remembered-branch";
import {
  resolveBranchOptions,
  resolveSelectedBranchIdentifier,
} from "~/features/branch-selection/utilities/resolve-branch-options";

export type BranchSelection =
  | { status: "loading" }
  | { status: "permission-missing" }
  | { status: "failed"; message: string; retry: () => void }
  | { status: "no-branches" }
  | {
      status: "choosing";
      branchOptions: WorkspaceBranch[];
      selectBranch: (branchIdentifier: string) => void;
    }
  | {
      status: "selected";
      branch: WorkspaceBranch;
      branchOptions: WorkspaceBranch[];
      selectBranch: (branchIdentifier: string) => void;
    };

/**
 * The branch the person is working at. HealthSchedule sends it with each
 * branch request; the API checks that the person may work there.
 */
export function useBranchSelection(
  platformSession: PlatformSession
): BranchSelection {
  const { user, activeContext } = platformSession;
  const organizationIdentifier = activeContext.organizationId ?? "";
  const canReadBranches = (activeContext.permissions ?? []).includes(
    BRANCH_READ_PERMISSION
  );
  const [chosenBranchIdentifier, setChosenBranchIdentifier] = useState(() =>
    readRememberedBranch(user.id, organizationIdentifier)
  );
  const branchQuery = useQuery({
    queryKey: BRANCH_SELECTION_QUERY_KEYS.branches(organizationIdentifier),
    queryFn: getWorkspaceBranches,
    enabled: canReadBranches && organizationIdentifier !== "",
  });

  if (!canReadBranches) return { status: "permission-missing" };
  if (branchQuery.isPending) return { status: "loading" };
  if (branchQuery.isError) {
    return {
      status: "failed",
      message: branchQuery.error.message,
      retry: () => void branchQuery.refetch(),
    };
  }

  const branchOptions = resolveBranchOptions(
    branchQuery.data,
    activeContext.branchIds ?? []
  );
  if (branchOptions.length === 0) return { status: "no-branches" };

  const selectBranch = (branchIdentifier: string) => {
    setChosenBranchIdentifier(branchIdentifier);
    rememberBranch(user.id, organizationIdentifier, branchIdentifier);
  };
  const selectedBranchIdentifier = resolveSelectedBranchIdentifier(
    branchOptions,
    chosenBranchIdentifier,
    activeContext.branchId ?? null
  );
  const branch = branchOptions.find(
    (branchOption) => branchOption.id === selectedBranchIdentifier
  );

  return branch
    ? { status: "selected", branch, branchOptions, selectBranch }
    : { status: "choosing", branchOptions, selectBranch };
}
