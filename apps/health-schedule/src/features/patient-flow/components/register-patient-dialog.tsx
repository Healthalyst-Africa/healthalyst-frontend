"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { PATIENT_SEX_OPTIONS } from "~/features/patient-flow/config/patient-flow";
import { useRegisterQuickPatient } from "~/features/patient-flow/hooks/use-patient-flow";
import {
  quickPatientFormSchema,
  type QuickPatientFormValues,
} from "~/features/patient-flow/schemas/patient-flow-form-schemas";
import type { PatientMatch } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import { toQuickPatientRequest } from "~/features/patient-flow/utilities/patient-flow-requests";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

const EMPTY_VALUES: QuickPatientFormValues = {
  firstName: "",
  lastName: "",
  sex: "",
  phone: "",
};

/**
 * Registers a new patient with name, sex and phone, then hands them to
 * check-in. The date of birth and other details can be added later.
 */
export function RegisterPatientDialog({
  open,
  onOpenChange,
  initialName,
  onRegistered,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the desk searched for, to save typing the name again. */
  initialName: string;
  onRegistered: (patient: PatientMatch) => void;
}) {
  const registerMutation = useRegisterQuickPatient();
  const [registrationIdentifier, setRegistrationIdentifier] = useState("");
  const form = useForm<QuickPatientFormValues>({
    resolver: zodResolver(quickPatientFormSchema),
    defaultValues: EMPTY_VALUES,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (open) {
      const [firstName = "", ...otherNames] = initialName
        .trim()
        .split(/\s+/)
        .filter((name) => !/\d/.test(name));
      form.reset({
        ...EMPTY_VALUES,
        firstName,
        lastName: otherNames.join(" "),
      });
      registerMutation.reset();
      setRegistrationIdentifier(crypto.randomUUID());
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (values) => {
      registerMutation.mutate(
        { ...toQuickPatientRequest(values), id: registrationIdentifier },
        {
          onSuccess: (patient) => {
            onOpenChange(false);
            onRegistered(patient);
          },
          onError: (error) => {
            applyFieldErrors(error, form.setError, [
              "firstName",
              "lastName",
              "sex",
              "phone",
            ]);
          },
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        firstName: "new-patient-first-name",
        lastName: "new-patient-last-name",
        sex: "new-patient-sex",
        phone: "new-patient-phone",
      })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Register a new patient"
      description="Search first to avoid a second record for the same person. The date of birth and address can be added after check-in."
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
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="new-patient-first-name"
          label="First name"
          autoComplete="off"
          error={errors.firstName?.message}
          {...form.register("firstName")}
        />
        <TextField
          id="new-patient-last-name"
          label="Last name"
          autoComplete="off"
          error={errors.lastName?.message}
          {...form.register("lastName")}
        />
      </div>
      <Controller
        control={form.control}
        name="sex"
        render={({ field }) => (
          <SelectField
            id="new-patient-sex"
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
        id="new-patient-phone"
        label="Phone number"
        description="For appointment reminders. A local number such as 0803 123 4567 is fine."
        type="tel"
        inputMode="tel"
        autoComplete="off"
        error={errors.phone?.message}
        {...form.register("phone")}
      />
    </FormDialog>
  );
}
