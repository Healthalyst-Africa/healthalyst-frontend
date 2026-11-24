import type { Metadata } from "next";
import { TestsAndScansPage } from "~/features/orders/components/tests-and-scans-page";

export const metadata: Metadata = { title: "Tests and scans | HealthSchedule" };

export default function TestsAndScansRoute() {
  return <TestsAndScansPage />;
}
