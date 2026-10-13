export const organizationTypeOptions = [
  { value: "HOSPITAL", label: "Hospital" },
  { value: "CLINIC", label: "Clinic" },
  { value: "DIAGNOSTIC_CENTRE", label: "Diagnostic centre" },
  { value: "LABORATORY", label: "Laboratory" },
  { value: "PHARMACY", label: "Pharmacy" },
] as const;

export type OrganizationType =
  (typeof organizationTypeOptions)[number]["value"];
