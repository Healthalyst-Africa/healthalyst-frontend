import type { Metadata } from "next";
import { CalendarsPage } from "~/features/schedule-setup/components/calendars-page";

export const metadata: Metadata = { title: "Calendars | HealthSchedule" };

export default function ScheduleCalendarsPage() {
  return <CalendarsPage />;
}
