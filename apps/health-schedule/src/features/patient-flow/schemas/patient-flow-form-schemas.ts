import { z } from "zod";
import {
  CHECK_IN_NOTE_MAXIMUM_LENGTH,
  PATIENT_AGE_MAXIMUM_YEARS,
  PATIENT_SEX_OPTIONS,
  UNKNOWN_PATIENT_LABEL_LENGTH,
} from "~/features/patient-flow/config/patient-flow";

const PATIENT_SEX_VALUES = PATIENT_SEX_OPTIONS.map((option) => option.value);

const sexSchema = z
  .string()
  .refine(
    (value) => PATIENT_SEX_VALUES.some((sexValue) => sexValue === value),
    "Choose the patient's sex"
  );

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

export type UnknownPatientFormValues = z.input<typeof unknownPatientFormSchema>;
export type CheckInFormValues = z.input<typeof checkInFormSchema>;
export type TransferFormValues = z.input<typeof transferFormSchema>;
