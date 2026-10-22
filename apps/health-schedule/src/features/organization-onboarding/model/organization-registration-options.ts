/*
 * Options for Platform API registration. The values are fixed by the
 * Platform API contract (`RegistrationBody` in its OpenAPI specification), so
 * the form can show them without a request. The labels are ours.
 */

export const organizationTypeOptions = [
  { value: "CLINIC", label: "Clinic" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "SPECIALIST_CLINIC", label: "Specialist clinic" },
  { value: "DIAGNOSTIC_CENTRE", label: "Diagnostic centre" },
  { value: "LABORATORY", label: "Laboratory" },
  { value: "IMAGING_CENTRE", label: "Imaging centre" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "MULTI_BRANCH_GROUP", label: "Group with several branches" },
] as const;

export type OrganizationType =
  (typeof organizationTypeOptions)[number]["value"];

export const productOptions = [
  {
    value: "HEALTHSCHEDULE",
    label: "HealthSchedule: scheduling and patient flow",
    selectedLabel: "HealthSchedule",
  },
  {
    value: "LABCONNECT",
    label: "LabConnect: laboratory and diagnostics",
    selectedLabel: "LabConnect",
  },
  {
    value: "PHARMADESK",
    label: "PharmaDesk: pharmacy and dispensing",
    selectedLabel: "PharmaDesk",
  },
] as const;

export type OrganizationProduct = (typeof productOptions)[number]["value"];

/** The 36 states and the Federal Capital Territory, by Platform state code. */
export const nigerianStateOptions = [
  { value: "AB", label: "Abia" },
  { value: "AD", label: "Adamawa" },
  { value: "AK", label: "Akwa Ibom" },
  { value: "AN", label: "Anambra" },
  { value: "BA", label: "Bauchi" },
  { value: "BY", label: "Bayelsa" },
  { value: "BE", label: "Benue" },
  { value: "BO", label: "Borno" },
  { value: "CR", label: "Cross River" },
  { value: "DE", label: "Delta" },
  { value: "EB", label: "Ebonyi" },
  { value: "ED", label: "Edo" },
  { value: "EK", label: "Ekiti" },
  { value: "EN", label: "Enugu" },
  { value: "FC", label: "Federal Capital Territory" },
  { value: "GO", label: "Gombe" },
  { value: "IM", label: "Imo" },
  { value: "JI", label: "Jigawa" },
  { value: "KD", label: "Kaduna" },
  { value: "KN", label: "Kano" },
  { value: "KT", label: "Katsina" },
  { value: "KE", label: "Kebbi" },
  { value: "KO", label: "Kogi" },
  { value: "KW", label: "Kwara" },
  { value: "LA", label: "Lagos" },
  { value: "NA", label: "Nasarawa" },
  { value: "NI", label: "Niger" },
  { value: "OG", label: "Ogun" },
  { value: "ON", label: "Ondo" },
  { value: "OS", label: "Osun" },
  { value: "OY", label: "Oyo" },
  { value: "PL", label: "Plateau" },
  { value: "RI", label: "Rivers" },
  { value: "SO", label: "Sokoto" },
  { value: "TA", label: "Taraba" },
  { value: "YO", label: "Yobe" },
  { value: "ZA", label: "Zamfara" },
] as const;

export type NigerianStateCode = (typeof nigerianStateOptions)[number]["value"];
