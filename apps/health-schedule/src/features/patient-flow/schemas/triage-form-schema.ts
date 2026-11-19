import { z } from "zod";
import {
  TRIAGE_TEXT_LIMITS,
  VITAL_SIGN_LIMITS,
} from "~/features/patient-flow/config/triage";
import type { TriageBand } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  assessDangerSigns,
  needsOverride,
  readNumber,
  readVitals,
  VITAL_SIGN_NAMES,
  type TriageFormValues,
  type VitalSignName,
} from "~/features/patient-flow/utilities/triage-assessment";

const VITAL_SIGN_UNITS: Record<VitalSignName, string> = {
  temperatureC: " °C",
  heartRate: " per minute",
  respiratoryRate: " per minute",
  systolicBp: " mmHg",
  diastolicBp: " mmHg",
  spo2: "%",
  glucoseMmolL: " mmol/L",
  weightKg: " kg",
  heightCm: " cm",
};

function checkVitalSign(
  name: VitalSignName,
  input: string,
  context: z.RefinementCtx
) {
  if (input.trim() === "") return;
  const limits = VITAL_SIGN_LIMITS[name];
  const number = readNumber(input);
  const range = `${limits.minimum} to ${limits.maximum}${VITAL_SIGN_UNITS[name]}`;
  if (number === undefined) {
    context.addIssue({
      code: "custom",
      path: [name],
      message: `Enter a number from ${range}`,
    });
    return;
  }
  const decimalPart = input.trim().split(".")[1] ?? "";
  if (decimalPart.length > limits.decimals) {
    context.addIssue({
      code: "custom",
      path: [name],
      message:
        limits.decimals === 0
          ? "Enter a whole number"
          : `Use at most ${limits.decimals} decimal place`,
    });
    return;
  }
  if (number < limits.minimum || number > limits.maximum) {
    context.addIssue({
      code: "custom",
      path: [name],
      message: `Enter a number from ${range}`,
    });
  }
}

/**
 * The vitals form. The danger signs apply only to adults, and a reason is
 * needed when the band is lower than red against a red suggestion or a red
 * patient.
 */
export function createTriageFormSchema({
  isAdult,
  currentBand,
}: {
  isAdult: boolean;
  currentBand: TriageBand | null;
}) {
  return z
    .object({
      complaint: z
        .string()
        .max(
          TRIAGE_TEXT_LIMITS.complaint,
          `Use ${TRIAGE_TEXT_LIMITS.complaint} characters or fewer`
        ),
      temperatureC: z.string(),
      heartRate: z.string(),
      respiratoryRate: z.string(),
      systolicBp: z.string(),
      diastolicBp: z.string(),
      spo2: z.string(),
      consciousness: z.string(),
      painScore: z.string(),
      glucoseMmolL: z.string(),
      weightKg: z.string(),
      heightCm: z.string(),
      band: z.string().min(1, "Choose a triage band"),
      overrideReason: z.string(),
      notes: z
        .string()
        .max(
          TRIAGE_TEXT_LIMITS.notes,
          `Use ${TRIAGE_TEXT_LIMITS.notes} characters or fewer`
        ),
    })
    .superRefine((values: TriageFormValues, context) => {
      for (const name of VITAL_SIGN_NAMES) {
        checkVitalSign(name, values[name], context);
      }
      const vitals = readVitals(values);
      if (
        vitals.systolicBp !== undefined &&
        vitals.diastolicBp !== undefined &&
        vitals.diastolicBp >= vitals.systolicBp
      ) {
        context.addIssue({
          code: "custom",
          path: ["diastolicBp"],
          message: "The lower number must be below the upper number",
        });
      }
      const suggestedBand = isAdult
        ? assessDangerSigns(vitals).suggestedBand
        : null;
      if (needsOverride({ band: values.band, suggestedBand, currentBand })) {
        const reason = values.overrideReason.trim();
        if (reason.length < TRIAGE_TEXT_LIMITS.overrideReason.minimum) {
          context.addIssue({
            code: "custom",
            path: ["overrideReason"],
            message: "Say why the band is lower than emergency",
          });
        } else if (reason.length > TRIAGE_TEXT_LIMITS.overrideReason.maximum) {
          context.addIssue({
            code: "custom",
            path: ["overrideReason"],
            message: `Use ${TRIAGE_TEXT_LIMITS.overrideReason.maximum} characters or fewer`,
          });
        }
      }
    });
}
