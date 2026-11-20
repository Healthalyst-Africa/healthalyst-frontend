import type { Metadata } from "next";
import { ConsultationPage } from "~/features/consultation/components/consultation-page";

export const metadata: Metadata = { title: "Consultation | HealthSchedule" };

export default function ConsultationRoute() {
  return <ConsultationPage />;
}
