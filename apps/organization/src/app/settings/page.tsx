import type { Metadata } from "next";
import { OrganizationSettingsPage } from "~/features/organization-settings/components/organization-settings-page";

export const metadata: Metadata = {
  title: "Organisation settings",
  robots: { index: false, follow: false },
};

export default function OrganizationSettingsRoute() {
  return <OrganizationSettingsPage />;
}
