"use client";

import type { ReactNode } from "react";
import {
  RecordHeader,
  type RecordHeaderStatus,
} from "@healthalyst/ui/components/record-header";
import {
  ALLERGY_SEVERITY_OPTIONS,
  ELIGIBILITY_PRESENTATION,
} from "~/features/patients/config/patients";
import type { PatientDetail } from "~/features/patients/schemas/patient-response-schemas";
import {
  describeCoverage,
  describeMissingFields,
  describePatientFacts,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";

function describeSeverity(
  severity: PatientDetail["allergies"][number]["severity"]
): string | null {
  return (
    ALLERGY_SEVERITY_OPTIONS.find(
      (option) => option.value === severity
    )?.label.toLowerCase() ?? null
  );
}

/** The patient's statuses: cover, restricted record, unfinished registration, messages. */
export function readPatientStatuses(
  patient: PatientDetail
): RecordHeaderStatus[] {
  const statuses: RecordHeaderStatus[] = [];
  if (patient.primaryCoverage) {
    const eligibility = patient.primaryCoverage.isExpired
      ? { label: "Cover expired", tone: "negative" as const }
      : ELIGIBILITY_PRESENTATION[patient.primaryCoverage.eligibility];
    statuses.push({
      key: "cover",
      label: `${describeCoverage(patient.primaryCoverage)}: ${eligibility.label}`,
      tone: eligibility.tone,
    });
  } else {
    statuses.push({ key: "cover", label: "Self-pay", tone: "neutral" });
  }
  if (patient.restricted) {
    statuses.push({
      key: "restricted",
      label: "Restricted record",
      tone: "highlight",
    });
  }
  if (patient.isTemporary) {
    statuses.push({
      key: "temporary",
      label: "Not yet identified",
      tone: "warning",
    });
  }
  if (patient.missingFields.length > 0) {
    statuses.push({
      key: "incomplete",
      label: `Add ${describeMissingFields(patient.missingFields)}`,
      tone: "warning",
    });
  }
  if (!patient.messaging.canMessage) {
    statuses.push({
      key: "messages",
      label: "No text reminders",
      tone: "neutral",
    });
  }
  return statuses;
}

const DEFAULT_UNKNOWN_ALLERGY_MESSAGE =
  "Allergies not asked yet. Ask the patient and record the answer.";

/**
 * Allergies come first on every clinical screen: in red when recorded, and a
 * prompt when nobody has asked yet.
 */
export function PatientAllergyLine({
  patient,
  whenUnknown = DEFAULT_UNKNOWN_ALLERGY_MESSAGE,
}: {
  patient: PatientDetail;
  /**
   * What to say when nobody has asked yet, for the person reading it. A
   * custom message is information for someone who is not asked to act, so
   * it is quiet rather than a warning.
   */
  whenUnknown?: string;
}) {
  if (patient.allergyStatus === "UNKNOWN") {
    return (
      <p
        className={
          whenUnknown === DEFAULT_UNKNOWN_ALLERGY_MESSAGE
            ? "font-medium text-status-warning"
            : "text-muted-foreground"
        }
      >
        {whenUnknown}
      </p>
    );
  }
  if (patient.allergyStatus === "NONE_KNOWN") {
    return <p className="text-muted-foreground">No known allergies.</p>;
  }
  return (
    <p className="font-medium text-destructive">
      Allergies:{" "}
      {patient.allergies
        .map((allergy) => {
          const severity = describeSeverity(allergy.severity);
          return severity
            ? `${allergy.substance} (${severity})`
            : allergy.substance;
        })
        .join(", ")}
    </p>
  );
}

/** The patient's name, facts, allergies and statuses, at the top of their record. */
export function PatientBanner({
  patient,
  actions,
}: {
  patient: PatientDetail;
  actions?: ReactNode;
}) {
  return (
    <RecordHeader
      title={describePatientFullName(patient)}
      details={[
        ...describePatientFacts(patient),
        ...(patient.phone ? [patient.phone] : []),
      ]}
      statuses={readPatientStatuses(patient)}
      alerts={<PatientAllergyLine patient={patient} />}
      actions={actions}
    />
  );
}
