import type { PatientRelationship } from "~/features/patients/schemas/patient-response-schemas";

/** The other person's name, as a patient or a contact. */
export function describeRelatedPerson(
  relationship: PatientRelationship
): string {
  if (relationship.relatedPatient) {
    const { firstName, lastName } = relationship.relatedPatient;
    return `${firstName} ${lastName}`;
  }
  return relationship.contact?.name ?? "Unnamed contact";
}

/** Guardians first, then emergency contacts, then everyone else by name. */
export function sortRelationships(
  relationships: readonly PatientRelationship[]
): PatientRelationship[] {
  const rank = (relationship: PatientRelationship) =>
    relationship.isGuardian ? 0 : relationship.isEmergencyContact ? 1 : 2;
  return [...relationships].sort(
    (first, second) =>
      rank(first) - rank(second) ||
      describeRelatedPerson(first).localeCompare(describeRelatedPerson(second))
  );
}

/** Who can sign a consent as the patient's guardian. */
export function listGuardians(
  relationships: readonly PatientRelationship[]
): PatientRelationship[] {
  return sortRelationships(
    relationships.filter((relationship) => relationship.isGuardian)
  );
}
