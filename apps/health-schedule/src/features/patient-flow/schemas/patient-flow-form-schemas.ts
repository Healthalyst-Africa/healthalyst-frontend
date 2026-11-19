import { z } from "zod";
import {
  CHECK_IN_NOTE_MAXIMUM_LENGTH,
  PATIENT_AGE_MAXIMUM_YEARS,
  PATIENT_NAME_MAXIMUM_LENGTH,
  PATIENT_SEX_OPTIONS,
  UNKNOWN_PATIENT_LABEL_LENGTH,
} from "~/features/patient-flow/config/patient-flow";
import { toInternationalPhoneNumber } from "~/features/patient-flow/utilities/phone-number";

const PATIENT_SEX_VALUES = PATIENT_SEX_OPTIONS.map((option) => option.value);

const sexSchema = z
  .string()
  .refine(
    (value) => PATIENT_SEX_VALUES.some((sexValue) => sexValue === value),
    "Choose the patient's sex"
  );

function nameSchema(fieldLabel: string) {
  return z
    .string()
    .trim()
    .min(1, `Enter the patient's ${fieldLabel}`)
    .max(
      PATIENT_NAME_MAXIMUM_LENGTH,
      `Use ${PATIENT_NAME_MAXIMUM_LENGTH} characters or fewer`
    );
}

/** Quick registration at the desk: the date of birth can follow later. */
export const quickPatientFormSchema = z.object({
  firstName: nameSchema("first name"),
  lastName: nameSchema("last name"),
  sex: sexSchema,
  phone: z
    .string()
    .trim()
    .min(1, "Enter a phone number")
    .refine(
      (value) => toInternationalPhoneNumber(value) !== null,
      "Enter a phone number such as 0803 123 4567"
    ),
});

/** An unidentified patient, such as someone brought in unconscious. */
export const unknownPatientFormSchema = z.object({
  sex: sexSchema,
  approximateAge: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (/^\d+$/.test(value) && Number(value) <= PATIENT_AGE_MAXIMUM_YEARS),
      `Enter an age in whole years, up to ${PATIENT_AGE_MAXIMUM_YEARS}, or leave it empty`
    ),
  label: z
    .string()
    .trim()
    .min(
      UNKNOWN_PATIENT_LABEL_LENGTH.minimum,
      "Describe the patient so staff can recognise them"
    )
    .max(
      UNKNOWN_PATIENT_LABEL_LENGTH.maximum,
      `Use ${UNKNOWN_PATIENT_LABEL_LENGTH.maximum} characters or fewer`
    ),
});

export const checkInFormSchema = z.object({
  /** An encoded queue target; see `queue-targets.ts`. */
  queueTarget: z.string().min(1, "Choose where the patient goes first"),
  note: z
    .string()
    .trim()
    .max(
      CHECK_IN_NOTE_MAXIMUM_LENGTH,
      `Use ${CHECK_IN_NOTE_MAXIMUM_LENGTH} characters or fewer`
    ),
});

export const transferFormSchema = z.object({
  queueTarget: z.string().min(1, "Choose where the patient goes next"),
  note: checkInFormSchema.shape.note,
});

export type QuickPatientFormValues = z.input<typeof quickPatientFormSchema>;
export type UnknownPatientFormValues = z.input<typeof unknownPatientFormSchema>;
export type CheckInFormValues = z.input<typeof checkInFormSchema>;
export type TransferFormValues = z.input<typeof transferFormSchema>;
