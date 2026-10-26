import type { ReactNode } from "react";
import { StaffWorkspaceLayout } from "~/features/staff-workspace/components/staff-workspace-layout";

export default function StaffDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <StaffWorkspaceLayout>{children}</StaffWorkspaceLayout>;
}
