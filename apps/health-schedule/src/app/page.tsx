import { OrganizationAccessPage } from "~/features/organization-access/components/organization-access-page";
import { HealthScheduleEntry } from "~/features/product-access/components/health-schedule-entry";

export default function HealthScheduleHomePage() {
  return <HealthScheduleEntry signedOutView={<OrganizationAccessPage />} />;
}
