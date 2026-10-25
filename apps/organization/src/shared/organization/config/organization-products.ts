/** HealthAlyst products, matching the Platform API's product codes. */
export const ORGANIZATION_PRODUCTS = [
  {
    code: "HEALTHSCHEDULE",
    name: "HealthSchedule",
    description: "Scheduling and patient flow",
  },
  {
    code: "LABCONNECT",
    name: "LabConnect",
    description: "Laboratory and diagnostics",
  },
  {
    code: "PHARMADESK",
    name: "PharmaDesk",
    description: "Pharmacy and dispensing",
  },
] as const;

export type OrganizationProductCode =
  (typeof ORGANIZATION_PRODUCTS)[number]["code"];
