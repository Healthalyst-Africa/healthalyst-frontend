import type { StatusTone } from "@healthalyst/ui/types/status-tone";
import type {
  OrganizationDocument,
  OrganizationDocumentType,
} from "~/features/organization-application/types/organization-application";

export const DOCUMENT_TYPE_LABELS: Record<OrganizationDocumentType, string> = {
  CAC_CERTIFICATE: "CAC certificate",
  FACILITY_LICENCE: "Facility licence",
  MEDICAL_DIRECTOR_LICENCE: "Medical director licence",
  MLSCN_LICENCE: "Medical laboratory licence",
  PCN_PREMISES_LICENCE: "Pharmacy premises licence",
  NHIA_ACCREDITATION: "NHIA accreditation",
  PROOF_OF_ADDRESS: "Proof of address",
  OTHER: "Other supporting document",
};

/** Guidance shown below each drop zone about which document to upload. */
export const DOCUMENT_TYPE_HINTS: Record<OrganizationDocumentType, string> = {
  CAC_CERTIFICATE:
    "Upload the certificate of incorporation or business name registration issued by the Corporate Affairs Commission.",
  FACILITY_LICENCE:
    "Upload the current registration or operating licence issued to this facility by your state's health regulator.",
  MEDICAL_DIRECTOR_LICENCE:
    "Upload the medical director's current annual practising licence from the Medical and Dental Council of Nigeria.",
  MLSCN_LICENCE:
    "Upload the laboratory's current licence from the Medical Laboratory Science Council of Nigeria.",
  PCN_PREMISES_LICENCE:
    "Upload the current premises licence from the Pharmacy Council of Nigeria.",
  NHIA_ACCREDITATION:
    "If the facility is accredited by the National Health Insurance Authority, upload the accreditation certificate.",
  PROOF_OF_ADDRESS:
    "Upload a recent utility bill, bank statement or tenancy agreement that shows the facility's address.",
  OTHER: "Upload any other document that supports this application.",
};

export const DOCUMENT_STATUS_PRESENTATION: Record<
  OrganizationDocument["status"],
  { label: string; tone: StatusTone; message?: string }
> = {
  // A stored document only stays here when its transfer was interrupted.
  UPLOADING: {
    label: "Upload not finished",
    tone: "warning",
    message: "This upload did not finish. Remove it and upload the file again.",
  },
  SCANNING: {
    label: "Checking file",
    tone: "information",
    message: "We are running a security check. This usually takes a moment.",
  },
  CLEAN: { label: "Uploaded", tone: "positive" },
  ACCEPTED: { label: "Accepted", tone: "positive" },
  INFECTED: {
    label: "Not accepted",
    tone: "negative",
    message:
      "This file failed the security check. Remove it and upload a new file.",
  },
  REJECTED: {
    label: "Rejected",
    tone: "negative",
    message:
      "This document was rejected. Remove it and upload a corrected file.",
  },
};

/** Statuses that change on their own, so the step keeps checking them. */
export const PENDING_DOCUMENT_STATUSES: readonly OrganizationDocument["status"][] =
  ["SCANNING"];

export const DOCUMENT_CONTENT_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
};
