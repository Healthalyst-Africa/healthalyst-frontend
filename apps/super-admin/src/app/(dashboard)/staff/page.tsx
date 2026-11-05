import type { Metadata } from "next";
import { StaffManagementPage } from "~/features/staff-management/components/staff-management-page";

export const metadata: Metadata = {
  title: "HealthAlyst staff | HealthAlyst Super Admin",
};

export default function StaffPage() {
  return <StaffManagementPage />;
}
