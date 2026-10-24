import type { ReviewChecklist } from "~/features/organization-oversight/types/review-types";
import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export type ReviewChecklistState = Record<keyof ReviewChecklist, boolean>;
export type ReviewApplicationProperties = {
  application: OrganizationApplication;
  staffIdentity: StaffIdentity;
};
