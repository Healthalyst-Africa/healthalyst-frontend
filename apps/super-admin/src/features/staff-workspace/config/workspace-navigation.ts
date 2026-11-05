import {
  AuditLogIcon,
  DashboardIcon,
  OrganizationIcon,
  PlatformStaffIcon,
  ReviewIcon,
} from "@healthalyst/icons";
import { APPLICATION_ROUTES } from "~/config/application-routes";

/**
 * Staff app pages. `roles` lists the platform roles a page needs; pages
 * without it are open to every staff member.
 */
export const WORKSPACE_NAVIGATION = [
  {
    label: "Overview",
    href: APPLICATION_ROUTES.dashboard,
    icon: DashboardIcon,
  },
  {
    label: "Organisations",
    href: APPLICATION_ROUTES.organizations,
    icon: OrganizationIcon,
  },
  {
    label: "Application reviews",
    href: APPLICATION_ROUTES.review,
    icon: ReviewIcon,
  },
  {
    label: "HealthAlyst staff",
    href: APPLICATION_ROUTES.staff,
    icon: PlatformStaffIcon,
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Audit log",
    href: APPLICATION_ROUTES.auditLog,
    icon: AuditLogIcon,
    roles: ["SUPER_ADMIN", "READ_ONLY_AUDITOR"],
  },
] as const satisfies readonly {
  label: string;
  href: string;
  icon: unknown;
  roles?: readonly string[];
}[];
