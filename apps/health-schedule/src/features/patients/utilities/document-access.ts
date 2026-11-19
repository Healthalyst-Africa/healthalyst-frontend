import {
  DOCUMENT_CATEGORY_OPTIONS,
  PATIENT_PERMISSIONS,
} from "~/features/patients/config/patients";
import type { PatientDocument } from "~/features/patients/schemas/patient-response-schemas";

export type DocumentPermissions = {
  /** Front desk (`patient:update`), nurses and doctors (`triage:record`). */
  canUpload: boolean;
  /** Referral letters and outside results open for clinical staff only. */
  canOpenClinical: boolean;
};

export function readDocumentPermissions(
  permissions: readonly string[]
): DocumentPermissions {
  const isClinical = permissions.includes(PATIENT_PERMISSIONS.recordTriage);
  return {
    canUpload: permissions.includes(PATIENT_PERMISSIONS.update) || isClinical,
    canOpenClinical: isClinical,
  };
}

export function canOpenDocument(
  document: PatientDocument,
  permissions: DocumentPermissions
): boolean {
  if (document.restricted) return false;
  return !document.clinical || permissions.canOpenClinical;
}

/** The title, or the kind of document when it has none or it is hidden. */
export function describeDocumentTitle(document: PatientDocument): string {
  const categoryLabel =
    DOCUMENT_CATEGORY_OPTIONS.find(
      (option) => option.value === document.category
    )?.label ?? "Document";
  if (document.restricted) return `${categoryLabel} (restricted)`;
  return document.title ?? categoryLabel;
}

/**
 * The newest checked card photo of each cover. A replaced photo stays in the
 * documents list, so the newest one wins.
 */
export function readLatestCardPhotos(
  documents: readonly PatientDocument[]
): Map<string, PatientDocument> {
  const cardPhotos = new Map<string, PatientDocument>();
  for (const document of documents) {
    if (
      document.category !== "HMO_CARD" ||
      document.status !== "CLEAN" ||
      document.coverageId === null
    ) {
      continue;
    }
    const current = cardPhotos.get(document.coverageId);
    if (!current || document.createdAt > current.createdAt) {
      cardPhotos.set(document.coverageId, document);
    }
  }
  return cardPhotos;
}
