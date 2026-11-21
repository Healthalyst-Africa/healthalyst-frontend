import { CONSCIOUSNESS_OPTIONS } from "~/features/patient-flow/config/triage";
import type { triageHistorySchema } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import type { z } from "zod";

type TriageRecord = z.infer<typeof triageHistorySchema>["data"][number];

/**
 * The practitioner calendar that belongs to the signed-in person, matched
 * by their membership of the organisation.
 */
export function findOwnCalendar<
  Calendar extends { kind: string; memberId: string | null; isActive: boolean },
>(
  calendars: readonly Calendar[],
  membershipId: string | null
): Calendar | undefined {
  if (!membershipId) return undefined;
  return calendars.find(
    (calendar) =>
      calendar.kind === "PRACTITIONER" &&
      calendar.isActive &&
      calendar.memberId === membershipId
  );
}

/** Recorded vital signs as labelled values, leaving out what was not taken. */
export function describeVitalSigns(
  triage: TriageRecord
): { term: string; description: string }[] {
  const consciousness = CONSCIOUSNESS_OPTIONS.find(
    (option) => option.value === triage.consciousness
  )?.label;
  const values: [string, string | null][] = [
    [
      "Temperature",
      triage.temperatureC === null ? null : `${triage.temperatureC} °C`,
    ],
    [
      "Pulse",
      triage.heartRate === null ? null : `${triage.heartRate} a minute`,
    ],
    [
      "Breathing",
      triage.respiratoryRate === null
        ? null
        : `${triage.respiratoryRate} a minute`,
    ],
    [
      "Blood pressure",
      triage.systolicBp === null || triage.diastolicBp === null
        ? null
        : `${triage.systolicBp}/${triage.diastolicBp} mmHg`,
    ],
    ["Oxygen", triage.spo2 === null ? null : `${triage.spo2}%`],
    ["Consciousness", consciousness ?? null],
    [
      "Blood glucose",
      triage.glucoseMmolL === null ? null : `${triage.glucoseMmolL} mmol/L`,
    ],
    [
      "Pain",
      triage.painScore === null ? null : `${triage.painScore} out of 10`,
    ],
  ];
  return values
    .filter((entry): entry is [string, string] => entry[1] !== null)
    .map(([term, description]) => ({ term, description }));
}
