"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import {
  DUPLICATE_CHECK_DELAY_MILLISECONDS,
  DUPLICATE_SCORES,
  PATIENT_PERMISSIONS,
} from "~/features/patients/config/patients";
import {
  PATIENT_FIELD_IDENTIFIERS,
  PatientDetailsFields,
} from "~/features/patients/components/patient-details-fields";
import {
  useDuplicateCheck,
  useRegisterPatient,
} from "~/features/patients/hooks/use-patients";
import {
  registrationFormSchema,
  type PatientFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type {
  Patient,
  PatientMatch,
} from "~/features/patients/schemas/patient-response-schemas";
import {
  describeDuplicateReasons,
  describePatientFacts,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";
import {
  toDuplicateCheckRequest,
  toRegistrationRequest,
} from "~/features/patients/utilities/patient-requests";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const EMPTY_VALUES: PatientFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  sex: "",
  birthKnown: "date",
  dateOfBirth: "",
  ageYears: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  stateCode: "",
  folderNumber: "",
  nin: "",
  preferredLanguage: "",
  contactChannel: "",
  detailsLater: false,
  remindersConsent: false,
};

/**
 * Registers a patient. Possible duplicates appear while the details are
 * typed, so the desk can pick the existing record instead.
 */
export function RegisterPatientDialog({
  open,
  onOpenChange,
  initialName = "",
  onRegistered,
  onChooseExisting,
  submitLabel = "Register",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What was searched for, to save typing the name again. */
  initialName?: string;
  onRegistered: (patient: Patient) => void;
  /** Picking a possible duplicate instead of registering. */
  onChooseExisting: (patient: PatientMatch) => void;
  submitLabel?: string;
}) {
  const { permissions } = useWorkspace();
  const canRecordNin = permissions.includes(
    PATIENT_PERMISSIONS.identityNumbers
  );
  const canRecordConsent = permissions.includes(PATIENT_PERMISSIONS.consent);
  const registerMutation = useRegisterPatient();
  const [registrationIdentifier, setRegistrationIdentifier] = useState("");
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: EMPTY_VALUES,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const values = form.watch();
  // Debounced as text: the request is a new object on every render.
  const duplicateRequestText = useDebouncedValue(
    JSON.stringify(toDuplicateCheckRequest(values)),
    DUPLICATE_CHECK_DELAY_MILLISECONDS
  );
  const duplicateQuery = useDuplicateCheck(
    duplicateRequestText,
    open && permissions.includes(PATIENT_PERMISSIONS.create)
  );
  const candidates = (duplicateQuery.data ?? []).filter(
    (candidate) => candidate.score >= DUPLICATE_SCORES.shown
  );

  useEffect(() => {
    if (open) {
      const [firstName = "", ...otherNames] = initialName
        .trim()
        .split(/\s+/)
        .filter((name) => name !== "" && !/\d/.test(name));
      form.reset({
        ...EMPTY_VALUES,
        firstName,
        lastName: otherNames.join(" "),
      });
      registerMutation.reset();
      // One identifier per registration, so a retry never makes a second patient.
      setRegistrationIdentifier(crypto.randomUUID());
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (formValues) => {
      registerMutation.mutate(
        toRegistrationRequest(formValues, {
          registrationIdentifier,
          canRecordNin,
          canRecordConsent,
        }),
        {
          onSuccess: (patient) => {
            onOpenChange(false);
            onRegistered(patient);
          },
          onError: (error) => {
            applyFieldErrors(error, form.setError, [
              "firstName",
              "middleName",
              "lastName",
              "sex",
              "dateOfBirth",
              "ageYears",
              "phone",
              "email",
              "addressLine",
              "city",
              "stateCode",
              "folderNumber",
              "nin",
            ]);
          },
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, PATIENT_FIELD_IDENTIFIERS)
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Register a patient"
      description="Possible duplicates appear as you type. Pick the existing patient rather than registering the same person twice."
      size="wide"
      submitLabel={submitLabel}
      submittingLabel="Registering"
      isSubmitting={registerMutation.isPending}
      error={
        registerMutation.isError && Object.keys(errors).length === 0
          ? registerMutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      {candidates.length > 0 && (
        <NoticeBanner
          tone="warning"
          title={
            candidates.length === 1
              ? "This may be a patient already registered"
              : `${candidates.length} registered patients may be the same person`
          }
        >
          <ul className="flex w-full flex-col gap-3">
            {candidates.map((candidate) => (
              <li
                key={candidate.patient.id}
                className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {describePatientFullName(candidate.patient)}
                    {candidate.score >= DUPLICATE_SCORES.likely && (
                      <StatusLabel tone="warning">Likely the same</StatusLabel>
                    )}
                  </span>
                  <span>
                    {[
                      ...describePatientFacts(candidate.patient),
                      ...(candidate.patient.phone
                        ? [candidate.patient.phone]
                        : []),
                    ].join(" · ")}
                  </span>
                  <span>{describeDuplicateReasons(candidate.reasons)}</span>
                </div>
                <ActionButton
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => {
                    onOpenChange(false);
                    onChooseExisting(candidate.patient);
                  }}
                >
                  Use this patient
                </ActionButton>
              </li>
            ))}
          </ul>
        </NoticeBanner>
      )}

      <Controller
        control={form.control}
        name="detailsLater"
        render={({ field }) => (
          <CheckboxField
            id={PATIENT_FIELD_IDENTIFIERS.detailsLater}
            label="Add the date of birth later"
            description="For bookings by phone or WhatsApp. The record shows a reminder until it is completed."
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <PatientDetailsFields
        form={form}
        showBirth={!values.detailsLater}
        canRecordNin={canRecordNin}
        birthRequired={!values.detailsLater}
        phoneRequired
        messageConsent={
          canRecordConsent && (
            <Controller
              control={form.control}
              name="remindersConsent"
              render={({ field }) => (
                <CheckboxField
                  id={PATIENT_FIELD_IDENTIFIERS.remindersConsent}
                  label="The patient agrees to appointment reminders and service messages"
                  description="Ask: “May we send you reminders?” Recorded as spoken consent."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          )
        }
      />
    </FormDialog>
  );
}
