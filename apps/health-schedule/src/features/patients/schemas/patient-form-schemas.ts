import { z } from "zod";
import {
  CONSENT_FIELD_LIMITS,
  DOCUMENT_UPLOAD_LIMITS,
  MERGE_REASON_LENGTH,
  PATIENT_FIELD_LIMITS,
  PATIENT_SEX_LABELS,
} from "~/features/patients/config/patients";
import { toInternationalPhoneNumber } from "~/shared/contact/phone-number";
import { branchToday } from "~/shared/time/branch-time";

const SEX_VALUES = Object.keys(PATIENT_SEX_LABELS);

function limitedText(maximum: number) {
  return z.string().trim().max(maximum, `Use ${maximum} characters or fewer`);
}

function requiredName(fieldLabel: string) {
  return z
    .string()
    .trim()
    .min(1, `Enter the patient's ${fieldLabel}`)
    .max(
      PATIENT_FIELD_LIMITS.name,
      `Use ${PATIENT_FIELD_LIMITS.name} characters or fewer`
    );
}

/**
 * The details every patient form shares. Everything is held as typed text;
 * requests are shaped from it in `patient-requests.ts`.
 */
const patientDetailsShape = {
  firstName: requiredName("first name"),
  middleName: limitedText(PATIENT_FIELD_LIMITS.name),
  lastName: requiredName("last name"),
  sex: z
    .string()
    .refine((value) => SEX_VALUES.includes(value), "Choose the patient's sex"),
  /** Whether the date of birth is known, or only an age. */
  birthKnown: z.enum(["date", "age"]),
  dateOfBirth: z.string(),
  ageYears: z.string().trim(),
  phone: z.string().trim(),
  email: limitedText(PATIENT_FIELD_LIMITS.email).refine(
    (value) => value === "" || z.email().safeParse(value).success,
    "Enter an email address such as name@example.com"
  ),
  addressLine: limitedText(PATIENT_FIELD_LIMITS.addressLine),
  city: limitedText(PATIENT_FIELD_LIMITS.city),
  stateCode: z.string(),
  folderNumber: limitedText(PATIENT_FIELD_LIMITS.folderNumber),
  nin: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{11}$/.test(value),
      "A NIN has 11 digits"
    ),
  preferredLanguage: z.string(),
  contactChannel: z.string(),
  /** Registration only: register now and add the date of birth later. */
  detailsLater: z.boolean(),
  /** Registration only: the patient agreed to reminders, told at the desk. */
  remindersConsent: z.boolean(),
};

type BirthAndPhone = {
  birthKnown: "date" | "age";
  dateOfBirth: string;
  ageYears: string;
  phone: string;
};

/** Date of birth or age, and a usable phone number. */
function checkBirthAndPhone(
  values: BirthAndPhone,
  context: z.RefinementCtx,
  {
    birthRequired,
    phoneRequired,
  }: { birthRequired: boolean; phoneRequired: boolean }
) {
  if (values.birthKnown === "date") {
    if (values.dateOfBirth === "") {
      if (birthRequired) {
        context.addIssue({
          code: "custom",
          path: ["dateOfBirth"],
          message: "Enter the date of birth, or choose “Only the age”",
        });
      }
    } else if (values.dateOfBirth > branchToday()) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "The date of birth cannot be in the future",
      });
    }
  } else if (values.ageYears === "") {
    if (birthRequired) {
      context.addIssue({
        code: "custom",
        path: ["ageYears"],
        message: "Enter the age in years",
      });
    }
  } else if (
    !/^\d+$/.test(values.ageYears) ||
    Number(values.ageYears) > PATIENT_FIELD_LIMITS.ageYears
  ) {
    context.addIssue({
      code: "custom",
      path: ["ageYears"],
      message: `Enter an age in whole years, up to ${PATIENT_FIELD_LIMITS.ageYears}`,
    });
  }
  if (values.phone === "") {
    if (!phoneRequired) return;
    context.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Enter a phone number",
    });
  } else if (toInternationalPhoneNumber(values.phone) === null) {
    context.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Enter a phone number such as 0803 123 4567",
    });
  }
}

/**
 * Registering a patient. A full registration needs the date of birth or age;
 * "details later" (for bookings by phone) needs only name, sex and phone.
 */
export const registrationFormSchema = z
  .object(patientDetailsShape)
  .superRefine((values, context) =>
    checkBirthAndPhone(values, context, {
      birthRequired: !values.detailsLater,
      phoneRequired: true,
    })
  );

/**
 * Editing a registered patient. The date of birth or age, and the phone,
 * stay required once the record has them.
 */
export function createPatientDetailsFormSchema({
  birthRequired,
  phoneRequired,
}: {
  birthRequired: boolean;
  phoneRequired: boolean;
}) {
  return z
    .object(patientDetailsShape)
    .superRefine((values, context) =>
      checkBirthAndPhone(values, context, { birthRequired, phoneRequired })
    );
}

export const allergyFormSchema = z.object({
  substance: z
    .string()
    .trim()
    .min(
      PATIENT_FIELD_LIMITS.allergySubstance.minimum,
      "Enter what the patient is allergic to"
    )
    .max(
      PATIENT_FIELD_LIMITS.allergySubstance.maximum,
      `Use ${PATIENT_FIELD_LIMITS.allergySubstance.maximum} characters or fewer`
    ),
  category: z.string().min(1, "Choose what kind of allergy it is"),
  reaction: limitedText(PATIENT_FIELD_LIMITS.allergyReaction),
  severity: z.string(),
  note: limitedText(PATIENT_FIELD_LIMITS.allergyNote),
});

export const endAllergyFormSchema = z.object({
  status: z.string().min(1, "Choose why the allergy is being ended"),
  reason: z
    .string()
    .trim()
    .min(PATIENT_FIELD_LIMITS.endReason.minimum, "Say why, in a few words")
    .max(
      PATIENT_FIELD_LIMITS.endReason.maximum,
      `Use ${PATIENT_FIELD_LIMITS.endReason.maximum} characters or fewer`
    ),
});

export const coverageFormSchema = z
  .object({
    payerType: z.string().min(1, "Choose the kind of cover"),
    payerName: z
      .string()
      .trim()
      .min(
        PATIENT_FIELD_LIMITS.payerName.minimum,
        "Enter the payer, such as Reliance HMO"
      )
      .max(
        PATIENT_FIELD_LIMITS.payerName.maximum,
        `Use ${PATIENT_FIELD_LIMITS.payerName.maximum} characters or fewer`
      ),
    planName: limitedText(PATIENT_FIELD_LIMITS.planName),
    memberNumber: z
      .string()
      .trim()
      .min(
        PATIENT_FIELD_LIMITS.memberNumber.minimum,
        "Enter the membership number on the card"
      )
      .max(
        PATIENT_FIELD_LIMITS.memberNumber.maximum,
        `Use ${PATIENT_FIELD_LIMITS.memberNumber.maximum} characters or fewer`
      ),
    relationship: z.string().min(1, "Choose how the patient is covered"),
    principalName: limitedText(PATIENT_FIELD_LIMITS.principalName),
    employerName: limitedText(PATIENT_FIELD_LIMITS.employerName),
    validFrom: z.string(),
    validUntil: z.string(),
    isPrimary: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.relationship !== "SELF" && values.principalName === "") {
      context.addIssue({
        code: "custom",
        path: ["principalName"],
        message: "Enter the name of the member who holds the plan",
      });
    }
    if (
      values.validFrom !== "" &&
      values.validUntil !== "" &&
      values.validUntil < values.validFrom
    ) {
      context.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "The end date cannot be before the start date",
      });
    }
  });

export const eligibilityFormSchema = z.object({
  result: z.string().min(1, "Choose what the payer said"),
  reference: limitedText(PATIENT_FIELD_LIMITS.eligibilityReference),
  note: limitedText(PATIENT_FIELD_LIMITS.eligibilityNote),
});

function reasonText(
  limits: { minimum: number; maximum: number },
  emptyMessage: string
) {
  return z
    .string()
    .trim()
    .min(limits.minimum, emptyMessage)
    .max(limits.maximum, `Use ${limits.maximum} characters or fewer`);
}

/**
 * A family member or guardian who is a patient here, or a contact who is
 * not. Contacts need a name; their phone number is optional.
 */
export const relationshipFormSchema = z
  .object({
    linkTo: z.enum(["patient", "contact"]),
    type: z.string().min(1, "Choose how they are related"),
    relatedPatientId: z.string(),
    relatedPatientName: z.string(),
    contactName: limitedText(PATIENT_FIELD_LIMITS.name),
    contactPhone: z.string().trim(),
    isGuardian: z.boolean(),
    isEmergencyContact: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.linkTo === "patient" && values.relatedPatientId === "") {
      context.addIssue({
        code: "custom",
        path: ["relatedPatientId"],
        message: "Find and choose the patient",
      });
    }
    if (values.linkTo === "contact") {
      if (values.contactName === "") {
        context.addIssue({
          code: "custom",
          path: ["contactName"],
          message: "Enter the contact's name",
        });
      }
      if (
        values.contactPhone !== "" &&
        toInternationalPhoneNumber(values.contactPhone) === null
      ) {
        context.addIssue({
          code: "custom",
          path: ["contactPhone"],
          message: "Enter a phone number such as 0803 123 4567",
        });
      }
    }
  });

/** Methods where someone writes or signs their name. */
const SIGNED_CONSENT_METHODS = ["WRITTEN", "ELECTRONIC_SIGNATURE"];

export const consentFormSchema = z
  .object({
    method: z.string().min(1, "Choose how consent was given"),
    language: z.string().min(1, "Choose the language it was explained in"),
    signedBy: z.enum(["PATIENT", "GUARDIAN"]),
    guardianRelationshipId: z.string(),
    signerName: limitedText(CONSENT_FIELD_LIMITS.name),
    witnessName: limitedText(CONSENT_FIELD_LIMITS.name),
    notes: limitedText(CONSENT_FIELD_LIMITS.notes),
  })
  .superRefine((values, context) => {
    if (
      values.signedBy === "GUARDIAN" &&
      values.guardianRelationshipId === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["guardianRelationshipId"],
        message: "Choose the guardian who gave consent",
      });
    }
    if (
      SIGNED_CONSENT_METHODS.includes(values.method) &&
      values.signerName === ""
    ) {
      context.addIssue({
        code: "custom",
        path: ["signerName"],
        message: "Enter the name as signed",
      });
    }
  });

export const revokeConsentFormSchema = z.object({
  reason: reasonText(
    CONSENT_FIELD_LIMITS.revokeReason,
    "Say why, in a few words"
  ),
});

export const documentUploadFormSchema = z
  .object({
    category: z.string().min(1, "Choose what kind of document it is"),
    title: limitedText(DOCUMENT_UPLOAD_LIMITS.titleMaximumLength),
    file: z
      .custom<File | null>()
      .refine((file) => file !== null, "Choose a file to upload"),
  })
  .superRefine((values, context) => {
    const file = values.file;
    if (!file) return;
    const contentTypes: readonly string[] =
      values.category === "PHOTO"
        ? DOCUMENT_UPLOAD_LIMITS.photoContentTypes
        : DOCUMENT_UPLOAD_LIMITS.contentTypes;
    if (!contentTypes.includes(file.type)) {
      context.addIssue({
        code: "custom",
        path: ["file"],
        message:
          values.category === "PHOTO"
            ? "A photo must be a JPEG or PNG image"
            : "Upload a PDF, JPEG or PNG file",
      });
    }
    if (file.size > DOCUMENT_UPLOAD_LIMITS.maximumBytes) {
      context.addIssue({
        code: "custom",
        path: ["file"],
        message: "The file is larger than 10 MB",
      });
    }
  });

export const removeDocumentFormSchema = z.object({
  reason: reasonText(
    DOCUMENT_UPLOAD_LIMITS.removeReason,
    "Say why, such as “uploaded to the wrong patient”"
  ),
});

export const mergeFormSchema = z.object({
  /** Fields whose value is taken from the record being merged away. */
  take: z.array(z.string()),
  reason: reasonText(
    MERGE_REASON_LENGTH,
    "Say why these are the same person, in a few words"
  ),
});

export const undoMergeFormSchema = z.object({
  reason: reasonText(MERGE_REASON_LENGTH, "Say why the merge is being undone"),
});

/** Registering and editing share one set of fields. */
export type PatientFormValues = z.input<typeof registrationFormSchema>;
export type AllergyFormValues = z.input<typeof allergyFormSchema>;
export type EndAllergyFormValues = z.input<typeof endAllergyFormSchema>;
export type CoverageFormValues = z.input<typeof coverageFormSchema>;
export type EligibilityFormValues = z.input<typeof eligibilityFormSchema>;
export type RelationshipFormValues = z.input<typeof relationshipFormSchema>;
export type ConsentFormValues = z.input<typeof consentFormSchema>;
export type RevokeConsentFormValues = z.input<typeof revokeConsentFormSchema>;
export type DocumentUploadFormValues = z.input<typeof documentUploadFormSchema>;
export type RemoveDocumentFormValues = z.input<typeof removeDocumentFormSchema>;
export type MergeFormValues = z.input<typeof mergeFormSchema>;
export type UndoMergeFormValues = z.input<typeof undoMergeFormSchema>;
