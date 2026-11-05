import type { Metadata } from "next";
import { AuditLogPage } from "~/features/audit-log/components/audit-log-page";

export const metadata: Metadata = {
  title: "Audit log | HealthAlyst Super Admin",
};

export default function AuditLogRoute() {
  return <AuditLogPage />;
}
