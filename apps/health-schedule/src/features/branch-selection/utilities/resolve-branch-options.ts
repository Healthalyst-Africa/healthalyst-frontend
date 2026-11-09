import { ALL_BRANCHES_SCOPE } from "~/features/branch-selection/config/branch-selection";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";

/**
 * The open branches a person may work at, by name. `branchScope` is the
 * session's branch list, where `*` means every branch.
 */
export function resolveBranchOptions(
  branches: readonly WorkspaceBranch[],
  branchScope: readonly string[]
): WorkspaceBranch[] {
  const worksAtEveryBranch = branchScope.includes(ALL_BRANCHES_SCOPE);
  return branches
    .filter(
      (branch) =>
        branch.isActive &&
        (worksAtEveryBranch || branchScope.includes(branch.id))
    )
    .sort((firstBranch, secondBranch) =>
      firstBranch.name.localeCompare(secondBranch.name)
    );
}

/**
 * The branch to open with: the one the person last chose, then the session's
 * active branch, then the only branch they have. With several branches and no
 * earlier choice, they choose.
 */
export function resolveSelectedBranchIdentifier(
  branchOptions: readonly WorkspaceBranch[],
  rememberedBranchIdentifier: string | null,
  activeBranchIdentifier: string | null
): string | null {
  const isOption = (branchIdentifier: string | null) =>
    branchIdentifier !== null &&
    branchOptions.some((branch) => branch.id === branchIdentifier);

  if (isOption(rememberedBranchIdentifier)) return rememberedBranchIdentifier;
  if (isOption(activeBranchIdentifier)) return activeBranchIdentifier;
  if (branchOptions.length === 1) return branchOptions[0]?.id ?? null;
  return null;
}
