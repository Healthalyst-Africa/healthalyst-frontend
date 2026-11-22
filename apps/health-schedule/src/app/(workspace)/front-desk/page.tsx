import type { Metadata } from "next";
import { FrontDeskPage } from "~/features/patient-flow/components/front-desk-page";

export const metadata: Metadata = { title: "Front desk | HealthSchedule" };

export default function FrontDeskRoute() {
  return <FrontDeskPage />;
}
