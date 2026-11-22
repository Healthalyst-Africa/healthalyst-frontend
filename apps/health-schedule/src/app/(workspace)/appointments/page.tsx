import type { Metadata } from "next";
import { AppointmentsPage } from "~/features/appointments/components/appointments-page";

export const metadata: Metadata = { title: "Appointments | HealthSchedule" };

export default function AppointmentsRoute() {
  return <AppointmentsPage />;
}
