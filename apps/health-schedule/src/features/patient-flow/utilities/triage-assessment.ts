import { differenceInYears, parseISO } from "date-fns";
import {
  ADULT_FROM_YEARS,
  DANGER_SIGNS,
  VITAL_SIGN_LIMITS,
} from "~/features/patient-flow/config/triage";
import type { TriageBand } from "~/features/patient-flow/schemas/patient-flow-response-schemas";

export type VitalSignName = keyof typeof VITAL_SIGN_LIMITS;
export type Consciousness = "ALERT" | "VOICE" | "PAIN" | "UNRESPONSIVE";

/** The vital signs as numbers, leaving out anything not recorded. */
export type TriageVitals = Partial<Record<VitalSignName, number>> & {
  consciousness?: Consciousness;
  painScore?: number;
};

/** What the vitals form holds: every field as typed. */
export type TriageFormValues = Record<VitalSignName, string> & {
  complaint: string;
  consciousness: string;
  painScore: string;
  band: string;
  overrideReason: string;
  notes: string;
};

export type DangerSignCode = (typeof DANGER_SIGNS)[number]["code"];

/** Every vital sign the form records as a number. */
export const VITAL_SIGN_NAMES: readonly VitalSignName[] = [
  "temperatureC",
  "heartRate",
  "respiratoryRate",
  "systolicBp",
  "diastolicBp",
  "spo2",
  "glucoseMmolL",
  "weightKg",
  "heightCm",
];

const CONSCIOUSNESS_VALUES: readonly Consciousness[] = [
  "ALERT",
  "VOICE",
  "PAIN",
  "UNRESPONSIVE",
];

/** The tests behind each danger sign, as the HealthSchedule API applies them. */
const DANGER_SIGN_TESTS: Record<
  DangerSignCode,
  (vitals: TriageVitals) => boolean
> = {
  SPO2_BELOW_90: ({ spo2 }) => spo2 !== undefined && spo2 < 90,
  SPO2_90_TO_93: ({ spo2 }) => spo2 !== undefined && spo2 >= 90 && spo2 <= 93,
  SYSTOLIC_BELOW_90: ({ systolicBp }) =>
    systolicBp !== undefined && systolicBp < 90,
  SYSTOLIC_ABOVE_180: ({ systolicBp }) =>
    systolicBp !== undefined && systolicBp > 180,
  HEART_RATE_BELOW_40: ({ heartRate }) =>
    heartRate !== undefined && heartRate < 40,
  HEART_RATE_ABOVE_130: ({ heartRate }) =>
    heartRate !== undefined && heartRate > 130,
  HEART_RATE_111_TO_130: ({ heartRate }) =>
    heartRate !== undefined && heartRate > 110 && heartRate <= 130,
  RESPIRATORY_RATE_BELOW_9: ({ respiratoryRate }) =>
    respiratoryRate !== undefined && respiratoryRate < 9,
  RESPIRATORY_RATE_ABOVE_29: ({ respiratoryRate }) =>
    respiratoryRate !== undefined && respiratoryRate > 29,
  RESPIRATORY_RATE_21_TO_29: ({ respiratoryRate }) =>
    respiratoryRate !== undefined &&
    respiratoryRate > 20 &&
    respiratoryRate <= 29,
  TEMPERATURE_BELOW_35: ({ temperatureC }) =>
    temperatureC !== undefined && temperatureC < 35,
  TEMPERATURE_40_OR_ABOVE: ({ temperatureC }) =>
    temperatureC !== undefined && temperatureC >= 40,
  TEMPERATURE_38_5_TO_40: ({ temperatureC }) =>
    temperatureC !== undefined && temperatureC >= 38.5 && temperatureC < 40,
  NOT_ALERT: ({ consciousness }) =>
    consciousness !== undefined && consciousness !== "ALERT",
  GLUCOSE_BELOW_3: ({ glucoseMmolL }) =>
    glucoseMmolL !== undefined && glucoseMmolL < 3,
  GLUCOSE_ABOVE_20: ({ glucoseMmolL }) =>
    glucoseMmolL !== undefined && glucoseMmolL > 20,
  SEVERE_PAIN: ({ painScore }) => painScore !== undefined && painScore >= 8,
};

/** A typed number, or undefined when empty or not a number. */
export function readNumber(input: string): number | undefined {
  const trimmedInput = input.trim();
  if (trimmedInput === "") return undefined;
  const number = Number(trimmedInput);
  return Number.isFinite(number) ? number : undefined;
}

/** The recorded vitals as numbers; empty fields are left out. */
export function readVitals(values: TriageFormValues): TriageVitals {
  const vitals: TriageVitals = {};
  for (const name of VITAL_SIGN_NAMES) {
    const number = readNumber(values[name]);
    if (number !== undefined) vitals[name] = number;
  }
  const consciousness = CONSCIOUSNESS_VALUES.find(
    (candidate) => candidate === values.consciousness
  );
  if (consciousness) vitals.consciousness = consciousness;
  const painScore = readNumber(values.painScore);
  if (painScore !== undefined) vitals.painScore = painScore;
  return vitals;
}

export function hasAnyVitals(vitals: TriageVitals): boolean {
  return Object.keys(vitals).length > 0;
}

/** Danger signs in the vitals, and the band they suggest: red beats yellow. */
export function assessDangerSigns(vitals: TriageVitals): {
  dangerSigns: (typeof DANGER_SIGNS)[number][];
  suggestedBand: "RED" | "YELLOW" | null;
} {
  const dangerSigns = DANGER_SIGNS.filter((sign) =>
    DANGER_SIGN_TESTS[sign.code](vitals)
  );
  const suggestedBand = dangerSigns.some((sign) => sign.band === "RED")
    ? "RED"
    : dangerSigns.length > 0
      ? "YELLOW"
      : null;
  return { dangerSigns, suggestedBand };
}

/**
 * Whether the danger signs apply: from 16, or when the age is not known (the
 * API errs towards urgency). Children are left to the nurse.
 */
export function isAssessedAsAdult(
  dateOfBirth: string | null,
  now: Date = new Date()
): boolean {
  return (
    dateOfBirth === null ||
    differenceInYears(now, parseISO(dateOfBirth)) >= ADULT_FROM_YEARS
  );
}

/**
 * The band to preselect: the danger signs' suggestion, or routine for an
 * adult with vitals recorded and no danger signs. None for children or before
 * any vitals are typed.
 */
export function suggestBand({
  vitals,
  isAdult,
}: {
  vitals: TriageVitals;
  isAdult: boolean;
}): TriageBand | null {
  if (!isAdult || !hasAnyVitals(vitals)) return null;
  return assessDangerSigns(vitals).suggestedBand ?? "GREEN";
}

/**
 * Choosing below a red suggestion, or lowering a patient who is already red,
 * needs the override permission and a reason.
 */
export function needsOverride({
  band,
  suggestedBand,
  currentBand,
}: {
  band: string;
  suggestedBand: "RED" | "YELLOW" | null;
  currentBand: TriageBand | null;
}): boolean {
  if (band === "" || band === "RED") return false;
  return suggestedBand === "RED" || currentBand === "RED";
}

export type TriageRequest = TriageVitals & {
  band: TriageBand;
  complaint?: string;
  notes?: string;
  overrideReason?: string;
};

function readText(text: string): string | undefined {
  const trimmedText = text.trim();
  return trimmedText === "" ? undefined : trimmedText;
}

const TRIAGE_BANDS: readonly TriageBand[] = ["RED", "YELLOW", "GREEN"];

/** The band a form value stands for, or null when none is chosen. */
export function readBand(value: string): TriageBand | null {
  return TRIAGE_BANDS.find((candidate) => candidate === value) ?? null;
}

/** The API request for a checked form. */
export function toTriageRequest(
  values: TriageFormValues,
  includeOverrideReason: boolean
): TriageRequest {
  const band = readBand(values.band);
  if (!band) throw new Error("Choose a triage band.");
  const complaint = readText(values.complaint);
  const notes = readText(values.notes);
  const overrideReason = includeOverrideReason
    ? readText(values.overrideReason)
    : undefined;
  return {
    ...readVitals(values),
    band,
    ...(complaint ? { complaint } : {}),
    ...(notes ? { notes } : {}),
    ...(overrideReason ? { overrideReason } : {}),
  };
}

const BAND_PRIORITY: Record<TriageBand, number> = {
  RED: 1,
  YELLOW: 2,
  GREEN: 3,
};
const UNTRIAGED_PRIORITY = 3;

/**
 * The patient's place among those waiting in the next queue, which calls the
 * highest priority first and, within it, whoever joined first: everyone
 * waiting at the same or a higher priority goes before them.
 */
export function predictQueuePosition(
  waitingBands: readonly (TriageBand | null)[],
  band: TriageBand
): number {
  const priority = BAND_PRIORITY[band];
  return (
    waitingBands.filter(
      (waitingBand) =>
        (waitingBand ? BAND_PRIORITY[waitingBand] : UNTRIAGED_PRIORITY) <=
        priority
    ).length + 1
  );
}

/** "1st", "2nd", "3rd", "4th" … for places in a queue. */
export function describeOrdinal(position: number): string {
  const lastTwoDigits = position % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${position}th`;
  const suffixes = ["th", "st", "nd", "rd"];
  return `${position}${suffixes[position % 10] ?? "th"}`;
}
