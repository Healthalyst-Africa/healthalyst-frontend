"use client";

import type { ReactNode } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormSection } from "@healthalyst/ui/components/form-section";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import {
  CONTACT_CHANNEL_OPTIONS,
  CONTACT_LANGUAGE_OPTIONS,
  PATIENT_FIELD_LIMITS,
  PATIENT_SEX_LABELS,
  STATE_OPTIONS,
} from "~/features/patients/config/patients";
import type { PatientFormValues } from "~/features/patients/schemas/patient-form-schemas";

const SEX_OPTIONS = Object.entries(PATIENT_SEX_LABELS).map(
  ([value, label]) => ({ value, label })
);

/** Element identifiers, for focusing the first field with an error. */
export const PATIENT_FIELD_IDENTIFIERS: Record<
  keyof PatientFormValues,
  string
> = {
  firstName: "patient-first-name",
  middleName: "patient-middle-name",
  lastName: "patient-last-name",
  sex: "patient-sex",
  birthKnown: "patient-age-only",
  dateOfBirth: "patient-date-of-birth",
  ageYears: "patient-age",
  phone: "patient-phone",
  email: "patient-email",
  addressLine: "patient-address",
  city: "patient-city",
  stateCode: "patient-state",
  folderNumber: "patient-folder-number",
  nin: "patient-nin",
  preferredLanguage: "patient-language",
  contactChannel: "patient-contact-channel",
  detailsLater: "patient-details-later",
  remindersConsent: "patient-reminders-consent",
};

/**
 * The registration details registering and editing share, in three groups
 * laid out two to a row: the patient, how to contact them, and messages.
 */
export function PatientDetailsFields({
  form,
  showBirth,
  canRecordNin,
  birthRequired,
  phoneRequired,
  messageConsent,
}: {
  form: UseFormReturn<PatientFormValues>;
  /** False while registering with "details later". */
  showBirth: boolean;
  canRecordNin: boolean;
  /** Whether the date of birth or age must be given. */
  birthRequired: boolean;
  /** Whether a phone number must be given. */
  phoneRequired: boolean;
  /** Registration only: the reminders consent, under the message settings. */
  messageConsent?: ReactNode;
}) {
  const errors = form.formState.errors;
  const birthKnown = form.watch("birthKnown");
  const ageOnlyField = (
    <Controller
      control={form.control}
      name="birthKnown"
      render={({ field }) => (
        <CheckboxField
          id={PATIENT_FIELD_IDENTIFIERS.birthKnown}
          label="Only the age is known"
          checked={field.value === "age"}
          onCheckedChange={(isChecked) =>
            field.onChange(isChecked ? "age" : "date")
          }
        />
      )}
    />
  );

  return (
    <>
      <FormSection title="Patient">
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.firstName}
          label="First name"
          required
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.name}
          error={errors.firstName?.message}
          {...form.register("firstName")}
        />
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.lastName}
          label="Last name"
          required
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.name}
          error={errors.lastName?.message}
          {...form.register("lastName")}
        />
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.middleName}
          label="Middle name"
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.name}
          error={errors.middleName?.message}
          {...form.register("middleName")}
        />
        <Controller
          control={form.control}
          name="sex"
          render={({ field }) => (
            <SelectField
              id={PATIENT_FIELD_IDENTIFIERS.sex}
              label="Sex"
              required
              placeholder="Choose"
              options={SEX_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.sex?.message}
            />
          )}
        />
        {showBirth && (
          <div className="flex flex-col gap-3">
            {birthKnown === "date" ? (
              <TextField
                id={PATIENT_FIELD_IDENTIFIERS.dateOfBirth}
                label="Date of birth"
                required={birthRequired}
                type="date"
                error={errors.dateOfBirth?.message}
                {...form.register("dateOfBirth")}
              />
            ) : (
              <TextField
                id={PATIENT_FIELD_IDENTIFIERS.ageYears}
                label="Age in years"
                required={birthRequired}
                description="An estimated date of birth is stored."
                inputMode="numeric"
                autoComplete="off"
                error={errors.ageYears?.message}
                {...form.register("ageYears")}
              />
            )}
            {!canRecordNin && ageOnlyField}
          </div>
        )}
        {/* With a NIN, the tick box takes the cell beside the date, so the
            folder number and NIN share the next row. */}
        {showBirth && canRecordNin && (
          <div className="flex items-start sm:pt-8">{ageOnlyField}</div>
        )}
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.folderNumber}
          label="Folder number"
          description="From a paper folder or an earlier system."
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.folderNumber}
          error={errors.folderNumber?.message}
          {...form.register("folderNumber")}
        />
        {canRecordNin && (
          <TextField
            id={PATIENT_FIELD_IDENTIFIERS.nin}
            label="NIN"
            description="The 11-digit National Identification Number."
            inputMode="numeric"
            autoComplete="off"
            maxLength={11}
            error={errors.nin?.message}
            {...form.register("nin")}
          />
        )}
      </FormSection>

      <FormSection title="Contact">
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.phone}
          label="Phone number"
          required={phoneRequired}
          description="Such as 0803 123 4567."
          type="tel"
          inputMode="tel"
          autoComplete="off"
          error={errors.phone?.message}
          {...form.register("phone")}
        />
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.email}
          label="Email"
          type="email"
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.email}
          error={errors.email?.message}
          {...form.register("email")}
        />
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.addressLine}
          label="Address"
          autoComplete="off"
          className="sm:col-span-2"
          maxLength={PATIENT_FIELD_LIMITS.addressLine}
          error={errors.addressLine?.message}
          {...form.register("addressLine")}
        />
        <TextField
          id={PATIENT_FIELD_IDENTIFIERS.city}
          label="Town or city"
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.city}
          error={errors.city?.message}
          {...form.register("city")}
        />
        <Controller
          control={form.control}
          name="stateCode"
          render={({ field }) => (
            <SelectField
              id={PATIENT_FIELD_IDENTIFIERS.stateCode}
              label="State"
              placeholder="Choose a state"
              options={STATE_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.stateCode?.message}
            />
          )}
        />
      </FormSection>

      <FormSection title="Messages">
        <Controller
          control={form.control}
          name="contactChannel"
          render={({ field }) => (
            <SelectField
              id={PATIENT_FIELD_IDENTIFIERS.contactChannel}
              label="Contact by"
              placeholder="SMS"
              options={CONTACT_CHANNEL_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="preferredLanguage"
          render={({ field }) => (
            <SelectField
              id={PATIENT_FIELD_IDENTIFIERS.preferredLanguage}
              label="Language"
              placeholder="English"
              options={CONTACT_LANGUAGE_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
        {messageConsent && (
          <div className="sm:col-span-2">{messageConsent}</div>
        )}
      </FormSection>
    </>
  );
}
