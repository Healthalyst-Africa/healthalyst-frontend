import type { Metadata } from "next";
import { AccessReviewsPage } from "~/features/sensitive-records/components/access-reviews-page";

export const metadata: Metadata = {
  title: "Emergency access reviews | HealthSchedule",
};

export default function AccessReviewsRoute() {
  return <AccessReviewsPage />;
}
