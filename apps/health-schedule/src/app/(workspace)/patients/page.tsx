import type { Metadata } from "next";
import { PatientsPage } from "~/features/patients/components/patients-page";

export const metadata: Metadata = { title: "Patients | HealthSchedule" };

export default function PatientsRoute() {
  return <PatientsPage />;
}
