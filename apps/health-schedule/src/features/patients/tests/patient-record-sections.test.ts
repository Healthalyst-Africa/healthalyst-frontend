import { describe, expect, it } from "vitest";
import {
  consentFormSchema,
  documentUploadFormSchema,
  mergeFormSchema,
  relationshipFormSchema,
  type ConsentFormValues,
  type RelationshipFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import {
  documentUploadStartedSchema,
  patientRelationshipSchema,
  type MergePreview,
  type Patient,
  type PatientConsent,
  type PatientDocument,
  type PatientMerge,
  type PatientRelationship,
} from "~/features/patients/schemas/patient-response-schemas";
import { readConsentChecklist } from "~/features/patients/utilities/consent-presentation";
import {
  canOpenDocument,
  describeDocumentTitle,
  readDocumentPermissions,
  readLatestCardPhotos,
} from "~/features/patients/utilities/document-access";
import {
  canUndoMerge,
  describeMergeState,
  describeMergeValue,
  readDefaultTakenFields,
} from "~/features/patients/utilities/merge-presentation";
import { describeDuplicateReasons } from "~/features/patients/utilities/patient-presentation";
import {
  toConsentRequest,
  toDocumentUploadRequest,
  toRelationshipRequest,
} from "~/features/patients/utilities/patient-requests";
import { readRecordSection } from "~/features/patients/utilities/record-section";
import {
  listGuardians,
  sortRelationships,
} from "~/features/patients/utilities/relationship-presentation";

const EMPTY_RELATIONSHIP: RelationshipFormValues = {
  linkTo: "patient",
  type: "MOTHER",
  relatedPatientId: "",
  relatedPatientName: "",
  contactName: "",
  contactPhone: "",
  isGuardian: false,
  isEmergencyContact: false,
};

const EMPTY_CONSENT: ConsentFormValues = {
  method: "VERBAL",
  language: "en",
  signedBy: "PATIENT",
  guardianRelationshipId: "",
  signerName: "",
  witnessName: "",
  notes: "",
};

function errorPaths(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
}): string[] {
  return (result.error?.issues ?? []).map((issue) => issue.path.join("."));
}

function relationship(
  overrides: Partial<PatientRelationship>
): PatientRelationship {
  return {
    id: "relationship-1",
    type: "OTHER",
    relatedPatient: null,
    contact: { name: "Contact", phone: null },
    isGuardian: false,
    isEmergencyContact: false,
    inverse: false,
    createdAt: "2026-11-01T09:00:00.000Z",
    ...overrides,
  };
}

const PATIENT: Patient = {
  id: "patient-1",
  patientNumber: "P000001",
  folderNumber: null,
  firstName: "Ngozi",
  lastName: "Okafor",
  middleName: null,
  sex: "female",
  dateOfBirth: "1988-04-12",
  dateOfBirthEstimated: false,
  phone: null,
  email: null,
  addressLine: null,
  city: null,
  stateCode: "FC",
  preferredLanguage: "ha",
  contactChannel: "SMS",
  missingFields: [],
  nin: null,
  hasNin: false,
  isTemporary: false,
  temporaryLabel: null,
  status: "ACTIVE",
  mergedIntoId: null,
  version: 4,
  createdAt: "2024-03-03T09:00:00.000Z",
};

const DOCUMENT: PatientDocument = {
  id: "document-1",
  patientId: "patient-1",
  category: "REFERRAL_LETTER",
  title: "Referral from Garki Clinic",
  coverageId: null,
  contentType: "application/pdf",
  sizeBytes: 2048,
  status: "CLEAN",
  clinical: true,
  restricted: false,
  createdAt: "2026-11-18T09:00:00.000Z",
  checkedAt: "2026-11-18T09:00:05.000Z",
  removedAt: null,
  removedReason: null,
};

describe("family and contacts", () => {
  it("needs a chosen patient, or a contact with a name", () => {
    expect(
      errorPaths(relationshipFormSchema.safeParse(EMPTY_RELATIONSHIP))
    ).toEqual(["relatedPatientId"]);
    expect(
      errorPaths(
        relationshipFormSchema.safeParse({
          ...EMPTY_RELATIONSHIP,
          linkTo: "contact",
          contactPhone: "12",
        })
      )
    ).toEqual(["contactName", "contactPhone"]);
  });

  it("sends either the related patient or the contact, never both", () => {
    expect(
      toRelationshipRequest({
        ...EMPTY_RELATIONSHIP,
        relatedPatientId: "patient-2",
        contactName: "Left over",
        isGuardian: true,
      })
    ).toEqual({
      type: "MOTHER",
      isGuardian: true,
      isEmergencyContact: false,
      relatedPatientId: "patient-2",
    });
    expect(
      toRelationshipRequest({
        ...EMPTY_RELATIONSHIP,
        linkTo: "contact",
        type: "NEXT_OF_KIN",
        contactName: " Musa Bello ",
        contactPhone: "0803 123 4567",
        isEmergencyContact: true,
      })
    ).toEqual({
      type: "NEXT_OF_KIN",
      isGuardian: false,
      isEmergencyContact: true,
      contact: { name: "Musa Bello", phone: "+2348031234567" },
    });
  });

  it("lists guardians first, then emergency contacts, then by name", () => {
    const sorted = sortRelationships([
      relationship({ id: "c", contact: { name: "Zainab", phone: null } }),
      relationship({ id: "b", isEmergencyContact: true }),
      relationship({ id: "a", contact: { name: "Amaka", phone: null } }),
      relationship({ id: "g", isGuardian: true }),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual(["g", "b", "a", "c"]);
    expect(listGuardians(sorted).map((entry) => entry.id)).toEqual(["g"]);
  });

  it("reads relationships turned round from the other patient", () => {
    const parsed = patientRelationshipSchema.parse({
      ...relationship({}),
      type: "WARD",
      inverse: true,
    });
    expect(parsed.type).toBe("WARD");
  });
});

describe("consents", () => {
  it("names the guardian, and the signer of a signed consent", () => {
    expect(
      errorPaths(
        consentFormSchema.safeParse({
          ...EMPTY_CONSENT,
          method: "WRITTEN",
          signedBy: "GUARDIAN",
        })
      )
    ).toEqual(["guardianRelationshipId", "signerName"]);
    expect(consentFormSchema.safeParse(EMPTY_CONSENT).success).toBe(true);
  });

  it("sends the guardian only for a guardian's consent, and leaves blanks out", () => {
    expect(
      toConsentRequest("TREATMENT", {
        ...EMPTY_CONSENT,
        guardianRelationshipId: "relationship-1",
        witnessName: " Nurse Ada ",
      })
    ).toEqual({
      type: "TREATMENT",
      method: "VERBAL",
      language: "en",
      signedBy: "PATIENT",
      witnessName: "Nurse Ada",
    });
    expect(
      toConsentRequest("REMINDERS", {
        ...EMPTY_CONSENT,
        signedBy: "GUARDIAN",
        guardianRelationshipId: "relationship-1",
      })
    ).toMatchObject({ guardianRelationshipId: "relationship-1" });
  });

  it("makes a checklist row per consent with the consent in force", () => {
    const given: PatientConsent = {
      id: "consent-2",
      type: "REMINDERS",
      method: "VERBAL",
      language: "en",
      signedBy: "PATIENT",
      guardianRelationshipId: null,
      signerName: null,
      witnessName: null,
      notes: null,
      givenAt: "2026-11-10T09:00:00.000Z",
      revokedAt: null,
      revokeReason: null,
    };
    const withdrawn: PatientConsent = {
      ...given,
      id: "consent-1",
      type: "MARKETING",
      revokedAt: "2026-11-11T09:00:00.000Z",
      revokeReason: "Asked to stop",
    };
    const rows = readConsentChecklist({
      current: {
        TREATMENT: false,
        DATA_SHARING: false,
        MARKETING: false,
        RESEARCH: false,
        REMINDERS: true,
      },
      history: [given, withdrawn],
    });
    expect(rows.map((row) => row.type)).toEqual([
      "TREATMENT",
      "DATA_SHARING",
      "REMINDERS",
      "MARKETING",
      "RESEARCH",
    ]);
    const reminders = rows.find((row) => row.type === "REMINDERS");
    expect(reminders?.isGiven).toBe(true);
    expect(reminders?.activeConsent?.id).toBe("consent-2");
    const marketing = rows.find((row) => row.type === "MARKETING");
    expect(marketing?.activeConsent).toBeNull();
    expect(marketing?.latestEntry?.revokedAt).not.toBeNull();
  });
});

describe("documents", () => {
  function file(name: string, type: string, size = 1024): File {
    return new File([new Uint8Array(size)], name, { type });
  }

  it("asks for a file, refuses PDFs as photos and files over 10 MB", () => {
    expect(
      errorPaths(
        documentUploadFormSchema.safeParse({
          category: "PHOTO",
          title: "",
          file: null,
        })
      )
    ).toEqual(["file"]);
    expect(
      errorPaths(
        documentUploadFormSchema.safeParse({
          category: "PHOTO",
          title: "",
          file: file("scan.pdf", "application/pdf"),
        })
      )
    ).toEqual(["file"]);
    expect(
      errorPaths(
        documentUploadFormSchema.safeParse({
          category: "ID_DOCUMENT",
          title: "",
          file: file("large.png", "image/png", 10 * 1024 * 1024 + 1),
        })
      )
    ).toEqual(["file"]);
    expect(
      documentUploadFormSchema.safeParse({
        category: "ID_DOCUMENT",
        title: "",
        file: file("id.pdf", "application/pdf"),
      }).success
    ).toBe(true);
  });

  it("describes the file for the upload request, with the card's cover", () => {
    expect(
      toDocumentUploadRequest(
        { category: "HMO_CARD", title: " Card ", file: null },
        file("card.jpg", "image/jpeg", 5000),
        "coverage-1"
      )
    ).toEqual({
      category: "HMO_CARD",
      title: "Card",
      contentType: "image/jpeg",
      sizeBytes: 5000,
      coverageId: "coverage-1",
    });
  });

  it("opens clinical documents for clinical staff only", () => {
    const frontDesk = readDocumentPermissions([
      "patient:read",
      "patient:update",
    ]);
    const nurse = readDocumentPermissions(["patient:read", "triage:record"]);
    expect(frontDesk).toEqual({ canUpload: true, canOpenClinical: false });
    expect(canOpenDocument(DOCUMENT, frontDesk)).toBe(false);
    expect(canOpenDocument(DOCUMENT, nurse)).toBe(true);
    expect(canOpenDocument({ ...DOCUMENT, clinical: false }, frontDesk)).toBe(
      true
    );
    expect(canOpenDocument({ ...DOCUMENT, restricted: true }, nurse)).toBe(
      false
    );
  });

  it("links each cover to its newest checked card photo", () => {
    const card = {
      ...DOCUMENT,
      category: "HMO_CARD" as const,
      clinical: false,
      coverageId: "coverage-1",
    };
    const cardPhotos = readLatestCardPhotos([
      {
        ...card,
        id: "newest-refused",
        status: "INFECTED",
        createdAt: "2026-11-19T10:00:00.000Z",
      },
      { ...card, id: "newer", createdAt: "2026-11-19T09:00:00.000Z" },
      { ...card, id: "older", createdAt: "2026-11-18T09:00:00.000Z" },
      { ...card, id: "other-cover", coverageId: "coverage-2" },
      { ...DOCUMENT, id: "not-a-card", coverageId: "coverage-1" },
    ]);
    expect(cardPhotos.get("coverage-1")?.id).toBe("newer");
    expect(cardPhotos.get("coverage-2")?.id).toBe("other-cover");
    expect(cardPhotos.size).toBe(2);
  });

  it("hides the title of a restricted document", () => {
    expect(describeDocumentTitle(DOCUMENT)).toBe("Referral from Garki Clinic");
    expect(describeDocumentTitle({ ...DOCUMENT, restricted: true })).toBe(
      "Referral letter (restricted)"
    );
    expect(describeDocumentTitle({ ...DOCUMENT, title: null })).toBe(
      "Referral letter"
    );
  });

  it("reads the signed upload link", () => {
    expect(
      documentUploadStartedSchema.parse({
        document: { ...DOCUMENT, status: "PENDING_UPLOAD" },
        upload: {
          method: "PUT",
          url: "https://storage.example.test/upload",
          headers: {
            "Content-Type": "application/pdf",
            "Content-Length": "2048",
          },
          expiresAt: "2026-11-18T09:15:00.000Z",
        },
      }).upload.headers["Content-Type"]
    ).toBe("application/pdf");
  });
});

describe("merging duplicates", () => {
  const preview: MergePreview = {
    survivor: PATIENT,
    merged: {
      ...PATIENT,
      id: "patient-2",
      patientNumber: "P000002",
      phone: "+2348031234567",
      stateCode: "LA",
    },
    differences: ["phone", "stateCode"],
  };

  it("fills the blanks of the record that stays by default", () => {
    expect(readDefaultTakenFields(preview)).toEqual(["phone"]);
  });

  it("shows each value in words", () => {
    expect(describeMergeValue("stateCode", preview.survivor)).toBe(
      "Federal Capital Territory"
    );
    expect(describeMergeValue("phone", preview.survivor)).toBe("Blank");
    expect(describeMergeValue("preferredLanguage", PATIENT)).toBe("Hausa");
    expect(describeMergeValue("dateOfBirth", PATIENT)).toBe("12 Apr 1988");
  });

  it("allows undo for 30 days, unless already undone", () => {
    const merge: PatientMerge = {
      id: "merge-1",
      survivorId: "patient-1",
      mergedId: "patient-2",
      fieldsTaken: ["phone"],
      reason: "Same phone and name",
      mergedById: "user-1",
      mergedAt: "2026-11-01T09:00:00.000Z",
      undoUntil: "2026-12-01T09:00:00.000Z",
      undoneAt: null,
      undoReason: null,
    };
    const now = new Date("2026-11-19T09:00:00.000Z");
    expect(canUndoMerge(merge, now)).toBe(true);
    expect(describeMergeState(merge, now).label).toBe(
      "Can undo until 1 Dec 2026"
    );
    expect(canUndoMerge(merge, new Date("2026-12-02T09:00:00.000Z"))).toBe(
      false
    );
    expect(
      canUndoMerge({ ...merge, undoneAt: "2026-11-02T09:00:00.000Z" }, now)
    ).toBe(false);
  });

  it("asks why the records are the same person", () => {
    expect(
      errorPaths(mergeFormSchema.safeParse({ take: [], reason: "same" }))
    ).toEqual(["reason"]);
  });

  it("describes why records look alike", () => {
    expect(describeDuplicateReasons(["SAME_PHONE", "SIMILAR_NAME"])).toBe(
      "Same phone number, Similar name"
    );
  });
});

describe("record sections", () => {
  it("opens the tab named in the address, or the overview", () => {
    expect(readRecordSection("documents")).toBe("documents");
    expect(readRecordSection("billing")).toBe("overview");
    expect(readRecordSection(null)).toBe("overview");
  });
});
