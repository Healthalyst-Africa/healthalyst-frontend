import type { Metadata } from "next";
import { TriagePage } from "~/features/patient-flow/components/triage-page";

export const metadata: Metadata = {
  title: "Triage and vitals | HealthSchedule",
};

export default function TriageRoute() {
  return <TriagePage />;
}
