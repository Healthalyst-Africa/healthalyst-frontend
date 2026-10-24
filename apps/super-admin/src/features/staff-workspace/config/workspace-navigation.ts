import {
  DashboardIcon,
  OrganizationIcon,
  ReviewIcon,
} from "@healthalyst/icons";
import { APPLICATION_ROUTES } from "~/config/application-routes";

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
] as const;
