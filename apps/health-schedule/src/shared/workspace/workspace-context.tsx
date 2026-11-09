"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import type { BranchSelection } from "~/features/branch-selection/hooks/use-branch-selection";

type WorkspaceContextValue = {
  platformSession: PlatformSession;
  organizationName: string;
  /** The signed-in person's permissions in this organisation. */
  permissions: readonly string[];
  branchSelection: BranchSelection;
};

const workspaceContext = createContext<WorkspaceContextValue | null>(null);

/** The signed-in workspace every HealthSchedule page works within. */
export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue;
  children: ReactNode;
}) {
  return (
    <workspaceContext.Provider value={value}>
      {children}
    </workspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const contextValue = useContext(workspaceContext);
  if (!contextValue) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  }
  return contextValue;
}
