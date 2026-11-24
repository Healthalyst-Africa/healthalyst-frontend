"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { DatePickerField } from "@healthalyst/ui/components/date-picker-field";
import { FieldLabelText } from "@healthalyst/ui/components/forms/field-label-text";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { CLINICAL_RECORD_LIMITS as LIMITS } from "~/features/clinical-record/config/clinical-record";
import {
  useDiagnosisSearch,
  useProblemActions,
} from "~/features/clinical-record/hooks/use-clinical-record";
import {
  problemFormSchema,
  type ProblemFormValues,
} from "~/features/clinical-record/schemas/clinical-record-form-schemas";
import { toCreateProblemRequest } from "~/features/clinical-record/utilities/problem-rules";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";
import { branchToday } from "~/shared/time/branch-time";

const SEARCH_DELAY_MILLISECONDS = 300;
const ENTRY_OPTIONS = [
  {
    value: "code",
    label: "Search ICD-11",
    description: "Find the diagnosis by its words or code.",
  },
  {
    value: "words",
    label: "Describe it",
    description:
      "When no ICD-11 entry fits, such as a symptom being worked up.",
  },
];
const EMPTY_PROBLEM: ProblemFormValues = {
  entry: "code",
  code: "",
  title: "",
  onsetDate: "",
  notes: "",
};

/**
 * Adds a problem or diagnosis to the patient's list, by ICD-11 code or in
 * words. Codes and titles show exactly as the WHO list gives them.
 */
export function AddProblemDialog({
  open,
  onOpenChange,
  patientId,
  visitId,
  noteId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  /** Links the problem to the visit it was diagnosed in. */
  visitId?: string;
  noteId?: string;
}) {
  const { create } = useProblemActions(patientId);
  const [problemIdentifier, setProblemIdentifier] = useState("");
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(
    searchText.trim(),
    SEARCH_DELAY_MILLISECONDS
  );
  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: EMPTY_PROBLEM,
    shouldFocusError: false,
  });
  const entry = useWatch({ control: form.control, name: "entry" });
  const isSearching =
    open &&
    entry === "code" &&
    debouncedSearchText.length >= LIMITS.diagnosisSearchMinimum;
  const diagnosisQuery = useDiagnosisSearch(debouncedSearchText, isSearching);
  const diagnoses = (diagnosisQuery.data ?? []).filter(
    (diagnosis) => diagnosis.selectable
  );
  const errors = form.formState.errors;

  useEffect(() => {
    if (open) {
      form.reset(EMPTY_PROBLEM);
      setSearchText("");
      setProblemIdentifier(globalThis.crypto.randomUUID());
      create.reset();
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(
    (values) =>
      create.mutate(
        toCreateProblemRequest(values, {
          id: problemIdentifier,
          visitId,
          noteId,
        }),
        {
          onSuccess: (problem) => {
            announceSuccess(`${problem.title} added`);
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, [
              "code",
              "title",
              "onsetDate",
              "notes",
            ]),
        }
      ),
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        code: "problem-diagnosis-search",
        title: "problem-title",
        onsetDate: "problem-onset",
        notes: "problem-notes",
      })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="wide"
      title="Add a problem"
      description="It goes on the patient's problem list, which every clinician caring for them sees."
      submitLabel="Add problem"
      submittingLabel="Adding"
      isSubmitting={create.isPending}
      error={
        create.isError && Object.keys(errors).length === 0
          ? create.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="entry"
        render={({ field }) => (
          <ChoiceCardGroup
            id="problem-entry"
            legend="How to record it"
            options={ENTRY_OPTIONS}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value as ProblemFormValues["entry"]);
              form.clearErrors();
            }}
          />
        )}
      />
      {entry === "code" ? (
        <div className="flex flex-col gap-3">
          <label
            htmlFor="problem-diagnosis-search"
            className="text-sm font-medium"
          >
            <FieldLabelText label="Diagnosis" required />
          </label>
          <SearchField
            id="problem-diagnosis-search"
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
            placeholder="Words or an ICD-11 code, such as malaria or 1F40"
            aria-required="true"
            aria-invalid={Boolean(errors.code)}
            aria-describedby={
              errors.code ? "problem-diagnosis-error" : undefined
            }
            autoComplete="off"
          />
          {errors.code && (
            <p
              id="problem-diagnosis-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {errors.code.message}
            </p>
          )}
          {isSearching && diagnosisQuery.isPending && (
            <p role="status" className="text-sm text-muted-foreground">
              Searching
            </p>
          )}
          {diagnosisQuery.isError && (
            <NoticeBanner tone="error" title="The search did not work">
              {diagnosisQuery.error.message}
            </NoticeBanner>
          )}
          {isSearching &&
            diagnosisQuery.isSuccess &&
            diagnoses.length === 0 && (
              <p role="status" className="text-sm text-muted-foreground">
                Nothing matches “{debouncedSearchText}”. Try other words, or
                describe the problem instead.
              </p>
            )}
          {diagnoses.length > 0 && (
            <Controller
              control={form.control}
              name="code"
              render={({ field }) => (
                <ChoiceCardGroup
                  id="problem-diagnosis"
                  legend="Matching diagnoses"
                  layout="stack"
                  maximumVisibleOptions={4}
                  options={diagnoses.map((diagnosis) => ({
                    value: diagnosis.code,
                    label: diagnosis.title,
                    description: `ICD-11 ${diagnosis.code}`,
                  }))}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue(
                      "title",
                      diagnoses.find((diagnosis) => diagnosis.code === value)
                        ?.title ?? ""
                    );
                    form.clearErrors("code");
                  }}
                />
              )}
            />
          )}
          <p className="text-xs text-muted-foreground">
            ICD-11 by the World Health Organization, licensed under CC BY-ND 3.0
            IGO.
          </p>
        </div>
      ) : (
        <TextField
          id="problem-title"
          label="Problem"
          required
          placeholder="Chest pain, cause not yet known"
          maxLength={LIMITS.problemTitle}
          error={errors.title?.message}
          {...form.register("title")}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="onsetDate"
          render={({ field }) => (
            <DatePickerField
              id="problem-onset"
              label="Started on"
              value={field.value}
              onValueChange={field.onChange}
              latestDate={branchToday()}
              error={errors.onsetDate?.message}
            />
          )}
        />
      </div>
      <TextAreaField
        id="problem-notes"
        label="Notes"
        maxLength={LIMITS.problemNotes}
        error={errors.notes?.message}
        {...form.register("notes")}
      />
    </FormDialog>
  );
}
