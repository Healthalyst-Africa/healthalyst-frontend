import { describe, expect, it } from "vitest";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import {
  resolveBranchOptions,
  resolveSelectedBranchIdentifier,
} from "~/features/branch-selection/utilities/resolve-branch-options";

const IKEJA: WorkspaceBranch = {
  id: "0f6b4c2a-1d3e-4f5a-8b7c-9d0e1f2a3b4c",
  name: "Ikeja",
  isActive: true,
};
const ABUJA: WorkspaceBranch = {
  id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  name: "Abuja",
  isActive: true,
};
const CLOSED_LEKKI: WorkspaceBranch = {
  id: "2b3c4d5e-6f70-4b8c-9d0e-1f2a3b4c5d6e",
  name: "Lekki",
  isActive: false,
};

describe("branch options", () => {
  it("offers every open branch, by name, to people who work at every branch", () => {
    expect(resolveBranchOptions([IKEJA, CLOSED_LEKKI, ABUJA], ["*"])).toEqual([
      ABUJA,
      IKEJA,
    ]);
  });

  it("offers only the branches in the person's scope", () => {
    expect(resolveBranchOptions([IKEJA, ABUJA], [IKEJA.id])).toEqual([IKEJA]);
  });

  it("never offers a closed branch, even when it is in scope", () => {
    expect(resolveBranchOptions([CLOSED_LEKKI], [CLOSED_LEKKI.id])).toEqual([]);
  });

  it("offers nothing without a branch scope", () => {
    expect(resolveBranchOptions([IKEJA, ABUJA], [])).toEqual([]);
  });
});

describe("selected branch", () => {
  const options = [ABUJA, IKEJA];

  it("keeps the branch the person chose", () => {
    expect(resolveSelectedBranchIdentifier(options, IKEJA.id, ABUJA.id)).toBe(
      IKEJA.id
    );
  });

  it("ignores a remembered branch that is no longer an option", () => {
    expect(
      resolveSelectedBranchIdentifier(options, CLOSED_LEKKI.id, ABUJA.id)
    ).toBe(ABUJA.id);
  });

  it("opens the only branch without asking", () => {
    expect(resolveSelectedBranchIdentifier([IKEJA], null, null)).toBe(IKEJA.id);
  });

  it("asks when there are several branches and no earlier choice", () => {
    expect(resolveSelectedBranchIdentifier(options, null, null)).toBeNull();
  });
});
