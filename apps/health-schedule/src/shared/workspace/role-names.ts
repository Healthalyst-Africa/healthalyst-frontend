/** The Platform API's preset roles, named the way staff say them. */
const ROLE_NAMES: Readonly<Record<string, string>> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  front_desk: "Front desk",
  triage_nurse: "Triage nurse",
  nurse: "Nurse",
  doctor: "Doctor",
  lab: "Laboratory scientist",
  radiology: "Radiology",
  pharmacist: "Pharmacist",
  cashier: "Cashier",
  hmo_desk: "HMO desk",
};

/** A custom role's code turned into words, such as "ward_clerk" → "Ward clerk". */
function humaniseRoleCode(roleCode: string): string {
  const words = roleCode.replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The person's roles in words, such as "Doctor" or "Doctor and Manager". */
export function describeRoles(roleCodes: readonly string[]): string | null {
  const names = roleCodes.map(
    (roleCode) => ROLE_NAMES[roleCode] ?? humaniseRoleCode(roleCode)
  );
  if (names.length === 0) return null;
  if (names.length === 1) return names[0] ?? null;
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}
