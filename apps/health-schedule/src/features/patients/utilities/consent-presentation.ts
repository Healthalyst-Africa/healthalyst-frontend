import {
  CONSENT_METHOD_OPTIONS,
  CONSENT_TYPES,
  CONTACT_LANGUAGE_OPTIONS,
} from "~/features/patients/config/patients";
import type {
  ConsentType,
  PatientConsent,
  PatientConsents,
} from "~/features/patients/schemas/patient-response-schemas";
import { describeDate } from "~/features/patients/utilities/patient-presentation";

export type ConsentChecklistRow = {
  type: ConsentType;
  label: string;
  description: string;
  isGiven: boolean;
  /** The consent in force, which a withdrawal ends. */
  activeConsent: PatientConsent | null;
  /** The newest entry of this type, given or withdrawn. */
  latestEntry: PatientConsent | null;
};

/** One row per consent type, in the order the desk asks about them. */
export function readConsentChecklist(
  consents: PatientConsents
): ConsentChecklistRow[] {
  return CONSENT_TYPES.map((consentType) => {
    const entries = consents.history.filter(
      (entry) => entry.type === consentType.value
    );
    return {
      type: consentType.value,
      label: consentType.label,
      description: consentType.description,
      isGiven: consents.current[consentType.value],
      activeConsent: entries.find((entry) => entry.revokedAt === null) ?? null,
      latestEntry: entries[0] ?? null,
    };
  });
}

function labelOf(
  options: readonly { value: string; label: string }[],
  value: string
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** Such as "Spoken, in Hausa, by the guardian, 12 Nov 2026". */
export function describeConsentGiven(consent: PatientConsent): string {
  return [
    labelOf(CONSENT_METHOD_OPTIONS, consent.method),
    `in ${labelOf(CONTACT_LANGUAGE_OPTIONS, consent.language)}`,
    consent.signedBy === "GUARDIAN" ? "by a guardian" : "by the patient",
    consent.signerName ? `signed “${consent.signerName}”` : null,
    consent.witnessName ? `witnessed by ${consent.witnessName}` : null,
    describeDate(consent.givenAt),
  ]
    .filter(Boolean)
    .join(", ");
}

export function describeConsentWithdrawn(consent: PatientConsent): string {
  if (!consent.revokedAt) return "";
  return [`Withdrawn ${describeDate(consent.revokedAt)}`, consent.revokeReason]
    .filter(Boolean)
    .join(": ");
}
