"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { FormSection } from "@healthalyst/ui/components/form-section";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { MERGE_REASON_LENGTH } from "~/features/patients/config/patients";
import {
  useMergeActions,
  useMergePreview,
} from "~/features/patients/hooks/use-patient-record-sections";
import {
  mergeFormSchema,
  type MergeFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type {
  Patient,
  PatientMatch,
} from "~/features/patients/schemas/patient-response-schemas";
import {
  describeMergeField,
  describeMergeValue,
  readDefaultTakenFields,
} from "~/features/patients/utilities/merge-presentation";
import {
  describeDate,
  describePatientFacts,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

const EMPTY_MERGE: MergeFormValues = { take: [], reason: "" };

function describeRecordChoice(patient: Patient): string {
  return [
    ...describePatientFacts(patient),
    `registered ${describeDate(patient.createdAt)}`,
  ].join(" · ");
}

/**
 * Two records of the same person side by side. Staff choose the record that
 * stays and, for each detail that differs, which value to keep. The other
 * record is closed and points to the one that stays; undo is possible for
 * 30 days.
 */
export function MergeDialog({
  patient,
  duplicate,
  onOpenChange,
}: {
  patient: Patient;
  duplicate: PatientMatch | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { merge } = useMergeActions();
  const [survivorId, setSurvivorId] = useState(patient.id);
  const mergedId =
    duplicate === null
      ? ""
      : survivorId === patient.id
        ? duplicate.id
        : patient.id;
  const previewQuery = useMergePreview(
    survivorId,
    mergedId,
    duplicate !== null
  );
  const preview = previewQuery.data;
  const form = useForm<MergeFormValues>({
    resolver: zodResolver(mergeFormSchema),
    defaultValues: EMPTY_MERGE,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (duplicate) {
      setSurvivorId(patient.id);
      form.reset(EMPTY_MERGE);
      merge.reset();
    }
    // Reset only when a different duplicate is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicate]);

  // Each comparison starts by filling the blanks of the record that stays.
  useEffect(() => {
    if (preview) form.setValue("take", readDefaultTakenFields(preview));
    // Only when a new comparison arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  const isVersionConflict =
    merge.error instanceof PlatformApiError &&
    merge.error.code === "VERSION_CONFLICT";

  const submit = form.handleSubmit(
    (values) => {
      if (!preview) return;
      merge.mutate(
        {
          survivorId: preview.survivor.id,
          mergedId: preview.merged.id,
          survivorVersion: preview.survivor.version,
          mergedVersion: preview.merged.version,
          take: values.take,
          reason: values.reason.trim(),
        },
        {
          onSuccess: () => {
            announceSuccess(
              `Records merged into ${preview.survivor.patientNumber}`
            );
            onOpenChange(false);
            if (preview.survivor.id !== patient.id) {
              router.push(HEALTH_SCHEDULE_ROUTES.patient(preview.survivor.id));
            }
          },
          onError: (error) => {
            if (
              error instanceof PlatformApiError &&
              error.code === "VERSION_CONFLICT"
            ) {
              void previewQuery.refetch();
              return;
            }
            applyFieldErrors(error, form.setError, ["reason"]);
          },
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, { reason: "merge-reason" })
  );

  const recordChoices = preview
    ? [preview.survivor, preview.merged]
        .sort((first, second) =>
          first.createdAt.localeCompare(second.createdAt)
        )
        .map((record, recordIndex) => ({
          value: record.id,
          label: `${describePatientFullName(record)} (${record.patientNumber})`,
          description: describeRecordChoice(record),
          note: recordIndex === 0 ? "Registered first" : undefined,
        }))
    : [];

  return (
    <FormDialog
      open={duplicate !== null}
      onOpenChange={(nextOpen) => {
        if (!merge.isPending) onOpenChange(nextOpen);
      }}
      size="wide"
      title="Merge duplicate records"
      description="Check that both records are the same person before you merge."
      submitLabel="Merge records"
      submittingLabel="Merging"
      isSubmitting={merge.isPending}
      error={
        isVersionConflict
          ? "One of the records changed while you were comparing them. The comparison has been refreshed; check it, then merge again."
          : merge.isError && Object.keys(errors).length === 0
            ? merge.error.message
            : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      {previewQuery.isPending ? (
        <LoadingPlaceholder
          label="Comparing the records"
          rows={[{ shape: "card" }, { shape: "text" }, { shape: "text" }]}
        />
      ) : previewQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not compare the records"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void previewQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{previewQuery.error.message}</p>
        </StateNotice>
      ) : (
        <>
          <ChoiceCardGroup
            id="merge-survivor"
            legend="Which record stays?"
            description="Usually the one registered first. The other record is closed and points to it."
            required
            layout="stack"
            options={recordChoices}
            value={survivorId}
            onValueChange={(value) => {
              setSurvivorId(value);
              merge.reset();
            }}
          />
          {previewQuery.data.differences.length === 0 ? (
            <NoticeBanner tone="information" title="The details match">
              Both records have the same registration details.
            </NoticeBanner>
          ) : (
            <FormSection
              title="Details that differ"
              description="Choose the correct value for each. Everything else stays as it is on the record that stays."
            >
              <Controller
                control={form.control}
                name="take"
                render={({ field }) => (
                  <div className="flex flex-col gap-5 sm:col-span-2">
                    {previewQuery.data.differences.map((differentField) => (
                      <ChoiceCardGroup
                        key={differentField}
                        id={`merge-field-${differentField}`}
                        legend={describeMergeField(differentField)}
                        options={[
                          {
                            value: "keep",
                            label: describeMergeValue(
                              differentField,
                              previewQuery.data.survivor
                            ),
                            description: `From ${previewQuery.data.survivor.patientNumber}, which stays`,
                          },
                          {
                            value: "take",
                            label: describeMergeValue(
                              differentField,
                              previewQuery.data.merged
                            ),
                            description: `From ${previewQuery.data.merged.patientNumber}`,
                          },
                        ]}
                        value={
                          field.value.includes(differentField) ? "take" : "keep"
                        }
                        onValueChange={(choice) =>
                          field.onChange(
                            choice === "take"
                              ? [...field.value, differentField]
                              : field.value.filter(
                                  (takenField) => takenField !== differentField
                                )
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              />
            </FormSection>
          )}
          <TextAreaField
            id="merge-reason"
            label="Why are these the same person?"
            required
            description="Such as “same NIN and phone; registered twice at Garki”."
            rows={2}
            maxLength={MERGE_REASON_LENGTH.maximum}
            error={errors.reason?.message}
            {...form.register("reason")}
          />
          <NoticeBanner tone="warning" title="You can undo this for 30 days">
            After that, or once either record changes, the merge is final.
          </NoticeBanner>
        </>
      )}
    </FormDialog>
  );
}
