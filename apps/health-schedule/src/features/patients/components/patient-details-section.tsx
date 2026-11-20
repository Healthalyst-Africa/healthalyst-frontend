"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { EditIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DetailList } from "@healthalyst/ui/components/detail-list";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  CONTACT_CHANNEL_OPTIONS,
  CONTACT_LANGUAGE_OPTIONS,
  PATIENT_PERMISSIONS,
  PATIENT_SEX_LABELS,
  STATE_OPTIONS,
} from "~/features/patients/config/patients";
import {
  PATIENT_FIELD_IDENTIFIERS,
  PatientDetailsFields,
} from "~/features/patients/components/patient-details-fields";
import { useUpdatePatient } from "~/features/patients/hooks/use-patients";
import {
  createPatientDetailsFormSchema,
  type PatientFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type { PatientDetail } from "~/features/patients/schemas/patient-response-schemas";
import {
  describeAge,
  describeDate,
  describeMissingFields,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";
import {
  toPatientChanges,
  toPatientFormValues,
} from "~/features/patients/utilities/patient-requests";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function labelOf(
  options: readonly { value: string; label: string }[],
  value: string | null
): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}

/** The patient's registration details, and editing them. */
export function PatientDetailsSection({ patient }: { patient: PatientDetail }) {
  const { permissions } = useWorkspace();
  const canEdit = permissions.includes(PATIENT_PERMISSIONS.update);
  const canSeeNin = permissions.includes(PATIENT_PERMISSIONS.identityNumbers);
  const [isEditing, setIsEditing] = useState(false);

  const birth = patient.dateOfBirth
    ? patient.dateOfBirthEstimated
      ? `${describeAge(patient.dateOfBirth, true)} (estimated)`
      : `${describeDate(patient.dateOfBirth)} (${describeAge(patient.dateOfBirth, false)})`
    : null;
  const address = [
    patient.addressLine,
    patient.city,
    labelOf(STATE_OPTIONS, patient.stateCode),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <ContentPanel
      heading="Details"
      headingLevel={2}
      headingAccessory={
        canEdit && (
          <ActionButton
            type="button"
            variant="outline"
            size="small"
            leadingIcon={<EditIcon className="size-4" />}
            onClick={() => setIsEditing(true)}
          >
            Edit details
          </ActionButton>
        )
      }
    >
      {patient.missingFields.length > 0 && (
        <NoticeBanner tone="warning" title="Registration not complete">
          Add the {describeMissingFields(patient.missingFields)}
          {canEdit ? " with “Edit details”." : "."} Booking and check-in still
          work meanwhile.
        </NoticeBanner>
      )}
      <DetailList
        variant="striped"
        items={[
          { term: "Name", description: describePatientFullName(patient) },
          { term: "Sex", description: PATIENT_SEX_LABELS[patient.sex] },
          { term: "Date of birth", description: birth },
          { term: "Phone", description: patient.phone },
          { term: "Email", description: patient.email },
          { term: "Address", description: address || null },
          { term: "Patient number", description: patient.patientNumber },
          {
            term: "Folder number",
            description: patient.folderNumber,
          },
          {
            term: "NIN",
            description: canSeeNin
              ? patient.nin
              : patient.hasNin
                ? "Recorded"
                : null,
          },
          {
            term: "Messages",
            description: `${
              labelOf(CONTACT_CHANNEL_OPTIONS, patient.messaging.channel) ??
              patient.messaging.channel
            } in ${
              labelOf(CONTACT_LANGUAGE_OPTIONS, patient.messaging.language) ??
              patient.messaging.language
            }${
              patient.messaging.canMessage
                ? ""
                : patient.messaging.remindersConsent
                  ? ", but no messages can be sent"
                  : ", no consent to reminders"
            }`,
          },
          { term: "Registered", description: describeDate(patient.createdAt) },
        ]}
      />
      {canEdit && (
        <EditPatientDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          patient={patient}
          canRecordNin={canSeeNin}
        />
      )}
    </ContentPanel>
  );
}

function EditPatientDialog({
  open,
  onOpenChange,
  patient,
  canRecordNin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PatientDetail;
  canRecordNin: boolean;
}) {
  const updateMutation = useUpdatePatient();
  const schema = useMemo(
    () =>
      createPatientDetailsFormSchema({
        birthRequired: patient.dateOfBirth !== null,
        phoneRequired: patient.phone !== null,
      }),
    [patient.dateOfBirth, patient.phone]
  );
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toPatientFormValues(patient),
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const isVersionConflict =
    updateMutation.error instanceof PlatformApiError &&
    updateMutation.error.code === "VERSION_CONFLICT";

  useEffect(() => {
    if (open) {
      form.reset(toPatientFormValues(patient));
      updateMutation.reset();
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (values) => {
      const changes = toPatientChanges(patient, values, { canRecordNin });
      if (Object.keys(changes).length === 0) {
        onOpenChange(false);
        return;
      }
      updateMutation.mutate(
        { patientId: patient.id, version: patient.version, changes },
        {
          onSuccess: () => {
            announceSuccess("Details saved");
            onOpenChange(false);
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
      title="Edit details"
      size="wide"
      submitLabel="Save details"
      submittingLabel="Saving"
      isSubmitting={updateMutation.isPending}
      error={
        updateMutation.isError &&
        !isVersionConflict &&
        Object.keys(errors).length === 0
          ? updateMutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      {isVersionConflict && (
        <NoticeBanner tone="warning" title="Someone else saved first">
          The latest version is loaded and your changes are still here. Check
          them and save again.
        </NoticeBanner>
      )}
      <PatientDetailsFields
        form={form}
        showBirth
        canRecordNin={canRecordNin}
        birthRequired={patient.dateOfBirth !== null}
        phoneRequired={patient.phone !== null}
      />
    </FormDialog>
  );
}
