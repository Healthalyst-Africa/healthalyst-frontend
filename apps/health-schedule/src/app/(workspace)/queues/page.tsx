import type { Metadata } from "next";
import { QueueBoardPage } from "~/features/patient-flow/components/queue-board-page";

export const metadata: Metadata = { title: "Queues | HealthSchedule" };

export default function QueuesRoute() {
  return <QueueBoardPage />;
}
