import {
  ApplicationsIcon,
  ApprovedIcon,
  ChangesRequestedIcon,
  PendingIcon,
} from "@healthalyst/icons";

export const WORKSPACE_OVERVIEW_CONFIGURATION = {
  recentApplicationLimit: 5,
} as const;

export const WORKSPACE_OVERVIEW_METRICS = [
  // Each metric has its own icon: a tick only for approved.
  { label: "Total applications", status: null, icon: ApplicationsIcon },
  {
    label: "Pending review",
    status: "PENDING_VERIFICATION",
    icon: PendingIcon,
  },
  {
    label: "Changes requested",
    status: "CHANGES_REQUESTED",
    icon: ChangesRequestedIcon,
  },
  { label: "Approved", status: "ACTIVE", icon: ApprovedIcon },
] as const;
