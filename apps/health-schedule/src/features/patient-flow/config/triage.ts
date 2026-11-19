import type { StatusTone } from "@healthalyst/ui/types/status-tone";

export const TRIAGE_ENDPOINTS = {
  triage: (visitId: string) =>
    `/v1/visits/${encodeURIComponent(visitId)}/triage`,
  patient: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}`,
} as const;

export const TRIAGE_PERMISSIONS = {
  record: "triage:record",
  /** Lower a red band, or choose below a red suggestion. */
  override: "triage:override",
} as const;

/** The vital-sign limits the HealthSchedule API accepts. */
export const VITAL_SIGN_LIMITS = {
  temperatureC: { minimum: 25, maximum: 45, decimals: 1 },
  heartRate: { minimum: 20, maximum: 250, decimals: 0 },
  respiratoryRate: { minimum: 4, maximum: 80, decimals: 0 },
  systolicBp: { minimum: 40, maximum: 300, decimals: 0 },
  diastolicBp: { minimum: 20, maximum: 200, decimals: 0 },
  spo2: { minimum: 50, maximum: 100, decimals: 0 },
  glucoseMmolL: { minimum: 0.5, maximum: 50, decimals: 1 },
  weightKg: { minimum: 0.3, maximum: 400, decimals: 1 },
  heightCm: { minimum: 20, maximum: 250, decimals: 1 },
} as const;

export const TRIAGE_TEXT_LIMITS = {
  complaint: 500,
  notes: 2000,
  overrideReason: { minimum: 3, maximum: 500 },
} as const;

export const PAIN_SCORE_OPTIONS = Array.from({ length: 11 }, (_, score) => ({
  value: String(score),
  label:
    score === 0
      ? "0, no pain"
      : score === 10
        ? "10, worst imaginable"
        : String(score),
}));

export const CONSCIOUSNESS_OPTIONS = [
  { value: "ALERT", label: "Alert" },
  { value: "VOICE", label: "Responds to voice" },
  { value: "PAIN", label: "Responds to pain" },
  { value: "UNRESPONSIVE", label: "Unresponsive" },
] as const;

export const TRIAGE_BAND_OPTIONS = [
  {
    value: "RED",
    label: "Emergency",
    description: "Seen first. Goes to the front of the doctor's queue.",
    tone: "negative",
  },
  {
    value: "YELLOW",
    label: "Urgent",
    description: "Seen before routine patients.",
    tone: "warning",
  },
  {
    value: "GREEN",
    label: "Routine",
    description: "Seen in order of arrival.",
    tone: "neutral",
  },
] as const satisfies readonly {
  value: string;
  label: string;
  description: string;
  tone: StatusTone;
}[];

/**
 * The danger signs are adult values: from this age the API suggests a band.
 * Children, and their bands, are left to the nurse.
 */
export const ADULT_FROM_YEARS = 16;

/**
 * The HealthSchedule API's danger signs and the band each suggests, so the
 * page can show them while vitals are typed. The API applies the same rules
 * when saving and its answer is the one recorded. These are draft values
 * awaiting clinical sign-off; change them only together with the API.
 */
export const DANGER_SIGNS = [
  { code: "SPO2_BELOW_90", band: "RED", label: "Oxygen saturation below 90%" },
  {
    code: "SPO2_90_TO_93",
    band: "YELLOW",
    label: "Oxygen saturation 90 to 93%",
  },
  {
    code: "SYSTOLIC_BELOW_90",
    band: "RED",
    label: "Systolic blood pressure below 90",
  },
  {
    code: "SYSTOLIC_ABOVE_180",
    band: "YELLOW",
    label: "Systolic blood pressure above 180",
  },
  { code: "HEART_RATE_BELOW_40", band: "RED", label: "Pulse below 40" },
  { code: "HEART_RATE_ABOVE_130", band: "RED", label: "Pulse above 130" },
  { code: "HEART_RATE_111_TO_130", band: "YELLOW", label: "Pulse 111 to 130" },
  {
    code: "RESPIRATORY_RATE_BELOW_9",
    band: "RED",
    label: "Breathing rate below 9",
  },
  {
    code: "RESPIRATORY_RATE_ABOVE_29",
    band: "RED",
    label: "Breathing rate above 29",
  },
  {
    code: "RESPIRATORY_RATE_21_TO_29",
    band: "YELLOW",
    label: "Breathing rate 21 to 29",
  },
  {
    code: "TEMPERATURE_BELOW_35",
    band: "RED",
    label: "Temperature below 35 °C",
  },
  {
    code: "TEMPERATURE_40_OR_ABOVE",
    band: "RED",
    label: "Temperature 40 °C or above",
  },
  {
    code: "TEMPERATURE_38_5_TO_40",
    band: "YELLOW",
    label: "Temperature 38.5 to 40 °C",
  },
  { code: "NOT_ALERT", band: "RED", label: "Not fully alert" },
  {
    code: "GLUCOSE_BELOW_3",
    band: "RED",
    label: "Blood glucose below 3 mmol/L",
  },
  {
    code: "GLUCOSE_ABOVE_20",
    band: "YELLOW",
    label: "Blood glucose above 20 mmol/L",
  },
  { code: "SEVERE_PAIN", band: "YELLOW", label: "Severe pain (8 or more)" },
] as const;
