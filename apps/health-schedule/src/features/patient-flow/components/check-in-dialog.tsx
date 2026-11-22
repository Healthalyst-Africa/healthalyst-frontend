"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { CHECK_IN_NOTE_MAXIMUM_LENGTH } from "~/features/patient-flow/config/patient-flow";
import { useCheckIn } from "~/features/patient-flow/hooks/use-patient-flow";
import {
  checkInFormSchema,
  type CheckInFormValues,
} from "~/features/patient-flow/schemas/patient-flow-form-schemas";
import {
  toCheckInRequest,
  type CheckInArrival,
} from "~/features/patient-flow/utilities/patient-flow-requests";
import {
  describeQueue,
  encodeQueueTarget,
  type QueueTargetOption,
} from "~/features/patient-flow/utilities/queue-targets";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { EligibilityDialog } from "~/features/patients/components/eligibility-dialog";
import { PatientAllergyLine } from "~/features/patients/components/patient-banner";
import {
  ELIGIBILITY_PRESENTATION,
  PATIENT_PERMISSIONS,
} from "~/features/patients/config/patients";
import { usePatientDetail } from "~/features/patients/hooks/use-patients";
import type { PatientCoverage } from "~/features/patients/schemas/patient-response-schemas";
import { describeCoverage } from "~/features/patients/utilities/patient-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { useWorkspace } from "~/shared/workspace/workspace-context";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

/** Who is being checked in, as the dialog shows them. */
export type CheckInCandidate = {
  arrival: CheckInArrival;
  patientId: string;
  patientName: string;
  /** Such as "HS-00012 · Booked 10:00 with Dr Bello". */
  details: string;
};

const DEFAULT_FIRST_QUEUE = encodeQueueTarget({ kind: "TRIAGE" });

/**
 * Opens the patient's visit and puts them in their first queue: triage
 * unless the desk sends them straight to a doctor or a department.
 */
export function CheckInDialog({
  candidate,
  onOpenChange,
  branchId,
  queueTargetOptions,
}: {
  candidate: CheckInCandidate | null;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  queueTargetOptions: readonly QueueTargetOption[];
}) {
  const checkInMutation = useCheckIn();
  const [checkingCoverage, setCheckingCoverage] =
    useState<PatientCoverage | null>(null);
  const [checkInIdentifier, setCheckInIdentifier] = useState("");
  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: { queueTarget: DEFAULT_FIRST_QUEUE, note: "" },
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (candidate) {
      form.reset({ queueTarget: DEFAULT_FIRST_QUEUE, note: "" });
      checkInMutation.reset();
      // A new identifier per patient; a retry of the same check-in reuses it.
      setCheckInIdentifier(crypto.randomUUID());
    }
    // Reset only when a different patient is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  const submit = form.handleSubmit(
    (values) => {
      if (!candidate) return;
      checkInMutation.mutate(
        toCheckInRequest({
          checkInIdentifier,
          branchId,
          arrival: candidate.arrival,
          values,
        }),
        {
          onSuccess: (visit) => {
            announceSuccess(
              `${candidate.patientName} is checked in as ${visit.token}`,
              visit.current
                ? `Waiting for ${describeQueue(visit.current)}.`
                : undefined
            );
            onOpenChange(false);
          },
          onError: (error) => {
            applyFieldErrors(error, form.setError, ["queueTarget", "note"]);
          },
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        queueTarget: "check-in-queue",
        note: "check-in-note",
      })
  );

  return (
    <>
      <FormDialog
        open={candidate !== null}
        onOpenChange={onOpenChange}
        title={candidate ? `Check in ${candidate.patientName}` : "Check in"}
        description={candidate?.details}
        submitLabel="Check in"
        submittingLabel="Checking in"
        isSubmitting={checkInMutation.isPending}
        error={
          checkInMutation.isError && Object.keys(errors).length === 0
            ? checkInMutation.error.message
            : undefined
        }
        onSubmit={(formEvent) => void submit(formEvent)}
      >
        {candidate && (
          <CheckInPatientSummary
            patientId={candidate.patientId}
            onCheckCoverage={setCheckingCoverage}
          />
        )}
        <Controller
          control={form.control}
          name="queueTarget"
          render={({ field }) => (
            <SelectField
              id="check-in-queue"
              label="Where the patient goes first"
              description="Most patients see a nurse for vital signs (temperature, blood pressure, pulse) before the doctor."
              required
              placeholder="Choose where the patient goes first"
              options={queueTargetOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.queueTarget?.message}
            />
          )}
        />
        <TextAreaField
          id="check-in-note"
          label="Note for staff"
          description="For example: came with a referral letter, or needs a wheelchair."
          rows={3}
          maxLength={CHECK_IN_NOTE_MAXIMUM_LENGTH}
          error={errors.note?.message}
          {...form.register("note")}
        />
      </FormDialog>
      {candidate && (
        <EligibilityDialog
          patientId={candidate.patientId}
          coverage={checkingCoverage}
          onOpenChange={(open) => {
            if (!open) setCheckingCoverage(null);
          }}
        />
      )}
    </>
  );
}

/**
 * What the desk confirms before sending the patient in: allergies, and who
 * pays. Cover can be checked with the payer from here.
 */
function CheckInPatientSummary({
  patientId,
  onCheckCoverage,
}: {
  patientId: string;
  onCheckCoverage: (coverage: PatientCoverage) => void;
}) {
  const { permissions } = useWorkspace();
  const canReadPatients = permissions.includes(PATIENT_PERMISSIONS.read);
  const canCheckCoverage = permissions.includes(PATIENT_PERMISSIONS.update);
  const patientQuery = usePatientDetail(patientId, canReadPatients);

  if (!canReadPatients || patientQuery.isError) return null;
  if (patientQuery.isPending) {
    return (
      <LoadingPlaceholder
        label="Loading allergies and cover"
        rows={[{ shape: "text" }, { shape: "text" }]}
      />
    );
  }
  const patient = patientQuery.data;
  const coverage = patient.primaryCoverage;
  const eligibility = coverage
    ? coverage.isExpired
      ? { label: "Cover expired", tone: "negative" as const }
      : ELIGIBILITY_PRESENTATION[coverage.eligibility]
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
      <PatientAllergyLine
        patient={patient}
        whenUnknown="Allergies are not recorded yet. The nurse will ask when taking vital signs."
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">Pays:</span>
        {coverage && eligibility ? (
          <>
            <span className="font-medium">{describeCoverage(coverage)}</span>
            <StatusLabel tone={eligibility.tone}>
              {eligibility.label}
            </StatusLabel>
            {canCheckCoverage && (
              <ActionButton
                type="button"
                variant="outline"
                size="small"
                onClick={() => onCheckCoverage(coverage)}
              >
                Record a cover check
              </ActionButton>
            )}
          </>
        ) : (
          <span className="font-medium">Self-pay</span>
        )}
      </div>
      <Link
        href={HEALTH_SCHEDULE_ROUTES.patient(patient.id)}
        className="w-fit text-primary underline-offset-4 hover:underline"
      >
        Open the full record
      </Link>
    </div>
  );
}
