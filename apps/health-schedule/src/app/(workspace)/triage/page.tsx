import type { Metadata } from "next";
import { TriagePage } from "~/features/patient-flow/components/triage-page";

export const metadata: Metadata = {
  title: "Vital signs | HealthSchedule",
};

export default function TriageRoute() {
  return <TriagePage />;
}
