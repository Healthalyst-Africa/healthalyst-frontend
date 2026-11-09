import type { Metadata } from "next";
import { AppointmentTypesPage } from "~/features/schedule-setup/components/appointment-types-page";

export const metadata: Metadata = {
  title: "Appointment types | HealthSchedule",
};

export default function ScheduleAppointmentTypesPage() {
  return <AppointmentTypesPage />;
}
