"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  ELIGIBILITY_PRESENTATION,
  ELIGIBILITY_RESULT_OPTIONS,
  PATIENT_FIELD_LIMITS,
} from "~/features/patients/config/patients";
import { useCoverageActions } from "~/features/patients/hooks/use-patients";
import {
  eligibilityFormSchema,
  type EligibilityFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type { PatientCoverage } from "~/features/patients/schemas/patient-response-schemas";
import { describeCoverage } from "~/features/patients/utilities/patient-presentation";
import { toEligibilityRequest } from "~/features/patients/utilities/patient-requests";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

const EMPTY_VALUES: EligibilityFormValues = {
  result: "",
  reference: "",
  note: "",
};

/**
 * Records what the payer said after the desk called or checked their portal,
 * at the record page or at check-in.
 */
export function EligibilityDialog({
  patientId,
  coverage,
  onOpenChange,
}: {
  patientId: string;
  /** The cover being checked; null closes the dialog. */
  coverage: PatientCoverage | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { recordEligibility } = useCoverageActions(patientId);
  const form = useForm<EligibilityFormValues>({
    resolver: zodResolver(eligibilityFormSchema),
    defaultValues: EMPTY_VALUES,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (coverage) {
      form.reset(EMPTY_VALUES);
      recordEligibility.reset();
    }
    // Reset only when a different cover is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverage]);

  const submit = form.handleSubmit(
    (values) => {
      if (!coverage) return;
      recordEligibility.mutate(
        { coverageId: coverage.id, request: toEligibilityRequest(values) },
        {
          onSuccess: (savedCoverage) => {
            announceSuccess(
              `${describeCoverage(savedCoverage)}: ${ELIGIBILITY_PRESENTATION[savedCoverage.eligibility].label}`
            );
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, [
              "result",
              "reference",
              "note",
            ]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        result: "eligibility-result",
        reference: "eligibility-reference",
        note: "eligibility-note",
      })
  );

  return (
    <FormDialog
      open={coverage !== null}
      onOpenChange={onOpenChange}
      title="Record a cover check"
      description={
        coverage
          ? `${describeCoverage(coverage)}, member ${coverage.memberNumber}. Record what the payer said by phone or on their portal.`
          : undefined
      }
      submitLabel="Save check"
      submittingLabel="Saving"
      isSubmitting={recordEligibility.isPending}
      error={
        recordEligibility.isError && Object.keys(errors).length === 0
          ? recordEligibility.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="result"
        render={({ field }) => (
          <ChoiceCardGroup
            id="eligibility-result"
            legend="What the payer said"
            required
            layout="stack"
            options={ELIGIBILITY_RESULT_OPTIONS}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.result?.message}
          />
        )}
      />
      <TextField
        id="eligibility-reference"
        label="Authorisation or reference code"
        autoComplete="off"
        maxLength={PATIENT_FIELD_LIMITS.eligibilityReference}
        error={errors.reference?.message}
        {...form.register("reference")}
      />
      <TextAreaField
        id="eligibility-note"
        label="Note"
        description="Such as what the plan covers for this visit."
        rows={2}
        maxLength={PATIENT_FIELD_LIMITS.eligibilityNote}
        error={errors.note?.message}
        {...form.register("note")}
      />
    </FormDialog>
  );
}
