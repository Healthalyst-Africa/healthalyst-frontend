export const productInterestOptions = [
  {
    value: "HealthSchedule: Scheduling & Patient Flow",
    label: "HealthSchedule: Scheduling & Patient Flow",
  },
  {
    value: "LabConnect: Laboratory & Diagnostics",
    label: "LabConnect: Laboratory & Diagnostics",
  },
  {
    value: "PharmaDesk: Pharmacy & Dispensing",
    label: "PharmaDesk: Pharmacy & Dispensing",
  },
  {
    value: "DentaFlow: Dental Practice Management",
    label: "DentaFlow: Dental Practice Management",
  },
  {
    value: "ImagingHub: Radiology & Imaging",
    label: "ImagingHub: Radiology & Imaging",
  },
  {
    value: "MedSupply: Equipment & Supply Procurement",
    label: "MedSupply: Equipment & Supply Procurement",
  },
  { value: "Full Product Suite", label: "Full Product Suite" },
  { value: "General Partnership", label: "General Partnership" },
  { value: "Investment Enquiry", label: "Investment Enquiry" },
] as const;

export type ProductInterest = (typeof productInterestOptions)[number]["value"];
