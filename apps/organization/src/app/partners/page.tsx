import type { Metadata } from "next";
import { PartnersPage } from "~/features/partner-network/components/partners-page";

export const metadata: Metadata = {
  title: "Partners",
  robots: { index: false, follow: false },
};

export default function PartnersRoute() {
  return <PartnersPage />;
}
