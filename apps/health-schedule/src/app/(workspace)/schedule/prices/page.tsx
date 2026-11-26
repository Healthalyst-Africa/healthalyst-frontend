import type { Metadata } from "next";
import { PricesPage } from "~/features/billing/components/prices-page";

export const metadata: Metadata = { title: "Prices | HealthSchedule" };

export default function PricesRoute() {
  return <PricesPage />;
}
