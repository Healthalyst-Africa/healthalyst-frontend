export const organizationTypeOptions = [
  { value: "HOSPITAL_OR_CLINIC", label: "Hospital or Clinic" },
  {
    value: "LABORATORY_DIAGNOSTIC_CENTRE",
    label: "Laboratory / Diagnostic Centre",
  },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "DENTAL_PRACTICE", label: "Dental Practice" },
  { value: "XRAY_IMAGING_CENTRE", label: "X-Ray / Imaging Centre" },
  {
    value: "MEDICAL_EQUIPMENT_SUPPLIER",
    label: "Medical Equipment Supplier",
  },
  { value: "INVESTOR_FUND", label: "Investor / Fund" },
  {
    value: "GOVERNMENT_HEALTH_INSTITUTION",
    label: "Government Health Institution",
  },
  {
    value: "NON_GOVERNMENTAL_ORGANISATION_DEVELOPMENT_ORGANISATION",
    label: "Non-Governmental Organisation / Development Organisation",
  },
  { value: "TECHNOLOGY_PARTNER", label: "Technology Partner" },
  { value: "OTHER", label: "Other" },
] as const;

export type OrganizationType =
  (typeof organizationTypeOptions)[number]["value"];
