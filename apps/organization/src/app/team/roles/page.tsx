import type { Metadata } from "next";
import { TeamRolesPage } from "~/features/team-management/components/team-roles-page";

export const metadata: Metadata = {
  title: "Roles and permissions",
  robots: { index: false, follow: false },
};

export default function TeamRolesRoute() {
  return <TeamRolesPage />;
}
