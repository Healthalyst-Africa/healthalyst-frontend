import {
  getHealthScheduleApplicationAddress,
  getSuperAdminApplicationAddress,
} from "@healthalyst/config/environment";
import type { OrganizationProductCode } from "~/shared/organization/config/organization-products";

const SUPER_ADMIN_DASHBOARD_PATH = "/dashboard";

/** Destination for platform staff who authenticate through the organisation hub. */
export function getSuperAdminDashboardAddress(): string | null {
  const superAdminApplicationAddress = getSuperAdminApplicationAddress();
  if (!superAdminApplicationAddress) return null;
  return new URL(SUPER_ADMIN_DASHBOARD_PATH, superAdminApplicationAddress).href;
}

/** The HealthSchedule application, or null when its address is not configured. */
export function getHealthScheduleAddress(): string | null {
  return getHealthScheduleApplicationAddress() ?? null;
}

/**
 * Product applications that have an app to open, by Platform API product code.
 * Products without a configured address are left out.
 */
export function getProductApplicationAddresses(): Partial<
  Record<OrganizationProductCode, string>
> {
  const healthScheduleAddress = getHealthScheduleAddress();
  return healthScheduleAddress ? { HEALTHSCHEDULE: healthScheduleAddress } : {};
}
