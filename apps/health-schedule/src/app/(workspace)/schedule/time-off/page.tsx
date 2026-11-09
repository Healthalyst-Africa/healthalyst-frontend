import type { Metadata } from "next";
import { TimeOffPage } from "~/features/schedule-setup/components/time-off-page";

export const metadata: Metadata = {
  title: "Time off and holidays | HealthSchedule",
};

export default function ScheduleTimeOffPage() {
  return <TimeOffPage />;
}
