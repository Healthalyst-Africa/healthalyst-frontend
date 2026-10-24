import {
  DashboardIcon,
  OrganizationIcon,
  ReviewIcon,
} from "@healthalyst/icons";

export const WORKSPACE_OVERVIEW_CONFIGURATION = {
  recentApplicationLimit: 5,
} as const;

export const WORKSPACE_OVERVIEW_METRICS = [
  { label: "Total applications", status: null, icon: OrganizationIcon },
  { label: "Pending review", status: "PENDING_VERIFICATION", icon: ReviewIcon },
  {
    label: "Changes requested",
    status: "CHANGES_REQUESTED",
    icon: DashboardIcon,
  },
  { label: "Approved", status: "ACTIVE", icon: OrganizationIcon },
] as const;
