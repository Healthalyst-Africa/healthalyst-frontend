import { getSuperAdminApplicationAddress } from "@healthalyst/config/environment";

const SUPER_ADMIN_DASHBOARD_PATH = "/dashboard";

/** Destination for platform staff who authenticate through the organisation hub. */
export function getSuperAdminDashboardAddress(): string | null {
  const superAdminApplicationAddress = getSuperAdminApplicationAddress();
  if (!superAdminApplicationAddress) return null;
  return new URL(SUPER_ADMIN_DASHBOARD_PATH, superAdminApplicationAddress).href;
}
