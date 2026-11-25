import type { Metadata } from "next";
import { CashierPage } from "~/features/billing/components/cashier-page";

export const metadata: Metadata = { title: "Cashier | HealthSchedule" };

export default function CashierRoute() {
  return <CashierPage />;
}
