"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import {
  PATIENT_SEX_OPTIONS,
  UNKNOWN_PATIENT_LABEL_LENGTH,
} from "~/features/patient-flow/config/patient-flow";
import { useRegisterUnknownPatient } from "~/features/patient-flow/hooks/use-patient-flow";
import {
  unknownPatientFormSchema,
  type UnknownPatientFormValues,
} from "~/features/patient-flow/schemas/patient-flow-form-schemas";
import type { PatientMatch } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import { toUnknownPatientRequest } from "~/features/patient-flow/utilities/patient-flow-requests";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

const EMPTY_VALUES: UnknownPatientFormValues = {
  sex: "",
  approximateAge: "",
  label: "",
};

/**
 * Care starts before identity: registers someone who cannot be identified,
 * such as an unconscious patient, with a description staff can recognise.
 * The record is completed or merged into the real one later.
 */
export function UnknownPatientDialog({
  open,
  onOpenChange,
  onRegistered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: (patient: PatientMatch) => void;
}) {
  const registerMutation = useRegisterUnknownPatient();
  const [registrationIdentifier, setRegistrationIdentifier] = useState("");
  const form = useForm<UnknownPatientFormValues>({
    resolver: zodResolver(unknownPatientFormSchema),
    defaultValues: EMPTY_VALUES,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (open) {
      form.reset(EMPTY_VALUES);
      registerMutation.reset();
      setRegistrationIdentifier(crypto.randomUUID());
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (values) => {
      registerMutation.mutate(
        { ...toUnknownPatientRequest(values), id: registrationIdentifier },
        {
          onSuccess: (patient) => {
            onOpenChange(false);
            onRegistered(patient);
          },
          onError: (error) => {
            applyFieldErrors(error, form.setError, [
              "sex",
              "approximateAge",
              "label",
            ]);
          },
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        sex: "unknown-patient-sex",
        approximateAge: "unknown-patient-age",
        label: "unknown-patient-label",
      })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Register an unknown patient"
      description="For someone who cannot be identified yet. Care starts now; their name and contact details are added later."
      submitLabel="Register and check in"
      submittingLabel="Registering"
      isSubmitting={registerMutation.isPending}
      error={
        registerMutation.isError && Object.keys(errors).length === 0
          ? registerMutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextField
        id="unknown-patient-label"
        label="Description"
        description="What staff will see until the patient is identified, such as “Unknown man, brought by ambulance”."
        maxLength={UNKNOWN_PATIENT_LABEL_LENGTH.maximum}
        autoComplete="off"
        error={errors.label?.message}
        {...form.register("label")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="sex"
          render={({ field }) => (
            <SelectField
              id="unknown-patient-sex"
              label="Sex"
              placeholder="Choose"
              options={PATIENT_SEX_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.sex?.message}
            />
          )}
        />
        <TextField
          id="unknown-patient-age"
          label="Approximate age (optional)"
          inputMode="numeric"
          autoComplete="off"
          error={errors.approximateAge?.message}
          {...form.register("approximateAge")}
        />
      </div>
    </FormDialog>
  );
}
