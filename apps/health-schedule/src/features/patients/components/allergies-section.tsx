"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { ExpandableSection } from "@healthalyst/ui/components/expandable-section";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  ALLERGY_CATEGORY_OPTIONS,
  ALLERGY_END_OPTIONS,
  ALLERGY_SEVERITY_OPTIONS,
  ALLERGY_STATUS_PRESENTATION,
  PATIENT_FIELD_LIMITS,
  PATIENT_PERMISSIONS,
} from "~/features/patients/config/patients";
import {
  useAllergies,
  useAllergyActions,
} from "~/features/patients/hooks/use-patients";
import {
  allergyFormSchema,
  endAllergyFormSchema,
  type AllergyFormValues,
  type EndAllergyFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type { PatientAllergy } from "~/features/patients/schemas/patient-response-schemas";
import { describeDate } from "~/features/patients/utilities/patient-presentation";
import {
  toAllergyRequest,
  toEndAllergyRequest,
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

function describeAllergy(allergy: PatientAllergy): string {
  if (allergy.kind === "NO_KNOWN_ALLERGIES") return "No known allergies";
  return allergy.substance ?? "Allergy";
}

function describeAllergyDetails(allergy: PatientAllergy): string {
  return [
    labelOf(ALLERGY_CATEGORY_OPTIONS, allergy.category),
    allergy.reaction,
    allergy.note,
    `recorded ${describeDate(allergy.recordedAt)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Who may record allergies: the front desk, nurses and doctors. */
function useCanRecordAllergies(): boolean {
  const { permissions } = useWorkspace();
  return (
    permissions.includes(PATIENT_PERMISSIONS.update) ||
    permissions.includes(PATIENT_PERMISSIONS.recordTriage)
  );
}

/** Allergies: shown to everyone who can open the record, in red when recorded. */
export function AllergiesSection({ patientId }: { patientId: string }) {
  const canRecord = useCanRecordAllergies();
  const allergiesQuery = useAllergies(patientId);
  const actions = useAllergyActions(patientId);
  const [isAdding, setIsAdding] = useState(false);
  const [endingAllergy, setEndingAllergy] = useState<PatientAllergy | null>(
    null
  );

  const allergies = allergiesQuery.data;
  const activeAllergies = (allergies?.active ?? []).filter(
    (allergy) => allergy.kind === "ALLERGY"
  );
  const endedEntries = (allergies?.history ?? []).filter(
    (allergy) => allergy.status !== "ACTIVE"
  );

  return (
    <ContentPanel
      heading="Allergies"
      headingLevel={2}
      headingAccessory={
        allergies && (
          <StatusLabel
            tone={ALLERGY_STATUS_PRESENTATION[allergies.status].tone}
          >
            {ALLERGY_STATUS_PRESENTATION[allergies.status].label}
          </StatusLabel>
        )
      }
    >
      {allergiesQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading allergies"
          rows={[{ shape: "text" }, { shape: "text" }]}
        />
      ) : allergiesQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load the allergies"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void allergiesQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{allergiesQuery.error.message}</p>
        </StateNotice>
      ) : (
        <>
          {allergiesQuery.data.status === "UNKNOWN" && (
            <p className="text-sm text-muted-foreground">
              Ask the patient whether they are allergic to any medicine, food or
              anything else, and record the answer.
            </p>
          )}
          {activeAllergies.length > 0 && (
            <ul className="flex flex-col gap-3">
              {activeAllergies.map((allergy) => (
                <li
                  key={allergy.id}
                  className="flex flex-col gap-2 rounded-lg border border-l-4 border-l-status-negative p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 font-medium text-destructive">
                      {describeAllergy(allergy)}
                      {allergy.severity && (
                        <StatusLabel tone="negative">
                          {labelOf(
                            ALLERGY_SEVERITY_OPTIONS,
                            allergy.severity
                          ) ?? allergy.severity}
                        </StatusLabel>
                      )}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {describeAllergyDetails(allergy)}
                    </span>
                  </div>
                  {canRecord && (
                    <ActionButton
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => {
                        actions.end.reset();
                        setEndingAllergy(allergy);
                      }}
                    >
                      End
                    </ActionButton>
                  )}
                </li>
              ))}
            </ul>
          )}
          {actions.recordNoneKnown.isError && (
            <NoticeBanner tone="error" title="That was not saved">
              {actions.recordNoneKnown.error.message}
            </NoticeBanner>
          )}
          {canRecord && (
            <div className="flex flex-wrap gap-2">
              <ActionButton
                type="button"
                variant="outline"
                size="compact"
                leadingIcon={<AddIcon />}
                onClick={() => {
                  actions.record.reset();
                  setIsAdding(true);
                }}
              >
                Record an allergy
              </ActionButton>
              {allergiesQuery.data.status !== "NONE_KNOWN" &&
                activeAllergies.length === 0 && (
                  <ActionButton
                    type="button"
                    variant="outline"
                    size="compact"
                    isLoading={actions.recordNoneKnown.isPending}
                    loadingText="Saving"
                    onClick={() =>
                      actions.recordNoneKnown.mutate(undefined, {
                        onSuccess: () =>
                          announceSuccess("Recorded: no known allergies"),
                      })
                    }
                  >
                    No known allergies
                  </ActionButton>
                )}
            </div>
          )}
          {endedEntries.length > 0 && (
            <ExpandableSection
              title={`Earlier entries (${endedEntries.length})`}
            >
              <ul className="flex flex-col gap-2 text-sm">
                {endedEntries.map((allergy) => (
                  <li key={allergy.id} className="flex flex-col gap-0.5">
                    <span
                      className={
                        allergy.status === "ENTERED_IN_ERROR"
                          ? "line-through"
                          : undefined
                      }
                    >
                      {describeAllergy(allergy)}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {allergy.status === "RESOLVED"
                        ? "No longer allergic"
                        : "Recorded by mistake"}
                      {allergy.endedAt
                        ? ` on ${describeDate(allergy.endedAt)}`
                        : ""}
                      {allergy.endReason ? `: ${allergy.endReason}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </ExpandableSection>
          )}
        </>
      )}
      {canRecord && (
        <>
          <AddAllergyDialog
            open={isAdding}
            onOpenChange={setIsAdding}
            mutation={actions.record}
          />
          <EndAllergyDialog
            allergy={endingAllergy}
            onOpenChange={(open) => {
              if (!open) setEndingAllergy(null);
            }}
            mutation={actions.end}
          />
        </>
      )}
    </ContentPanel>
  );
}

const EMPTY_ALLERGY: AllergyFormValues = {
  substance: "",
  category: "",
  reaction: "",
  severity: "",
  note: "",
};

function AddAllergyDialog({
  open,
  onOpenChange,
  mutation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useAllergyActions>["record"];
}) {
  const form = useForm<AllergyFormValues>({
    resolver: zodResolver(allergyFormSchema),
    defaultValues: EMPTY_ALLERGY,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (open) form.reset(EMPTY_ALLERGY);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (values) =>
      mutation.mutate(toAllergyRequest(values), {
        onSuccess: () => {
          announceSuccess(`Allergy recorded: ${values.substance.trim()}`);
          onOpenChange(false);
        },
        onError: (error) =>
          applyFieldErrors(error, form.setError, [
            "substance",
            "category",
            "reaction",
            "severity",
            "note",
          ]),
      }),
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        substance: "allergy-substance",
        category: "allergy-category",
        reaction: "allergy-reaction",
        severity: "allergy-severity",
        note: "allergy-note",
      })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Record an allergy"
      submitLabel="Record allergy"
      submittingLabel="Recording"
      isSubmitting={mutation.isPending}
      error={
        mutation.isError && Object.keys(errors).length === 0
          ? mutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextField
        id="allergy-substance"
        label="Allergic to"
        required
        description="Such as penicillin, peanuts or latex."
        autoComplete="off"
        maxLength={PATIENT_FIELD_LIMITS.allergySubstance.maximum}
        error={errors.substance?.message}
        {...form.register("substance")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <SelectField
              id="allergy-category"
              label="Kind"
              required
              placeholder="Choose"
              options={ALLERGY_CATEGORY_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="severity"
          render={({ field }) => (
            <SelectField
              id="allergy-severity"
              label="Severity"
              placeholder="Not known"
              options={ALLERGY_SEVERITY_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>
      <TextField
        id="allergy-reaction"
        label="Reaction"
        description="What happens, such as a rash or swelling of the lips."
        autoComplete="off"
        maxLength={PATIENT_FIELD_LIMITS.allergyReaction}
        error={errors.reaction?.message}
        {...form.register("reaction")}
      />
      <TextAreaField
        id="allergy-note"
        label="Note"
        rows={2}
        maxLength={PATIENT_FIELD_LIMITS.allergyNote}
        error={errors.note?.message}
        {...form.register("note")}
      />
    </FormDialog>
  );
}

const EMPTY_END: EndAllergyFormValues = { status: "", reason: "" };

function EndAllergyDialog({
  allergy,
  onOpenChange,
  mutation,
}: {
  allergy: PatientAllergy | null;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useAllergyActions>["end"];
}) {
  const form = useForm<EndAllergyFormValues>({
    resolver: zodResolver(endAllergyFormSchema),
    defaultValues: EMPTY_END,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (allergy) form.reset(EMPTY_END);
    // Reset only when a different allergy is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allergy]);

  const submit = form.handleSubmit(
    (values) => {
      if (!allergy) return;
      mutation.mutate(
        { allergyId: allergy.id, request: toEndAllergyRequest(values) },
        {
          onSuccess: () => {
            announceSuccess("Allergy ended");
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, ["status", "reason"]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        status: "end-allergy-status",
        reason: "end-allergy-reason",
      })
  );

  return (
    <FormDialog
      open={allergy !== null}
      onOpenChange={onOpenChange}
      title={allergy ? `End “${describeAllergy(allergy)}”` : "End allergy"}
      description="It stays in the patient's history."
      submitLabel="End allergy"
      submittingLabel="Ending"
      isSubmitting={mutation.isPending}
      error={
        mutation.isError && Object.keys(errors).length === 0
          ? mutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <ChoiceCardGroup
            id="end-allergy-status"
            legend="Why"
            required
            layout="stack"
            options={ALLERGY_END_OPTIONS}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.status?.message}
          />
        )}
      />
      <TextAreaField
        id="end-allergy-reason"
        label="Details"
        required
        description="Such as “allergy test negative, 12 May”."
        rows={2}
        maxLength={PATIENT_FIELD_LIMITS.endReason.maximum}
        error={errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
