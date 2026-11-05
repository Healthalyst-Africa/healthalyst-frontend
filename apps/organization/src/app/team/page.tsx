import type { Metadata } from "next";
import { TeamPage } from "~/features/team-management/components/team-page";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export default function TeamRoute() {
  return <TeamPage />;
}
