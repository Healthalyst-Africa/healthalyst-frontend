import type { Metadata } from "next";
import { ResultsInboxPage } from "~/features/orders/components/results-inbox-page";

export const metadata: Metadata = {
  title: "Results to review | HealthSchedule",
};

export default function ResultsRoute() {
  return <ResultsInboxPage />;
}
