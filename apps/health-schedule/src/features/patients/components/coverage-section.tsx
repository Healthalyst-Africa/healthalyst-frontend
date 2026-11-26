"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  AddCardPhotoIcon,
  AddIcon,
  EditIcon,
  EligibilityCheckIcon,
  EndCoverIcon,
  OpenDocumentIcon,
  PreferredIcon,
} from "@healthalyst/icons";
import { ActionMenu } from "@healthalyst/ui/components/action-menu";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DatePickerField } from "@healthalyst/ui/components/date-picker-field";
import { DetailList } from "@healthalyst/ui/components/detail-list";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { ScrollRegion } from "@healthalyst/ui/components/scroll-region";
import {
  COVER_TAGS,
  COVERAGE_RELATIONSHIP_OPTIONS,
  PATIENT_FIELD_LIMITS,
  PATIENT_PERMISSIONS,
  PAYER_TYPE_OPTIONS,
} from "~/features/patients/config/patients";
import { EligibilityDialog } from "~/features/patients/components/eligibility-dialog";
import { UploadDocumentDialog } from "~/features/patients/components/upload-document-dialog";
import {
  useDocuments,
  useOpenDocument,
} from "~/features/patients/hooks/use-patient-record-sections";
import {
  useCoverage,
  useCoverageActions,
} from "~/features/patients/hooks/use-patients";
import {
  coverageFormSchema,
  type CoverageFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type { PatientCoverage } from "~/features/patients/schemas/patient-response-schemas";
import {
  describeCoverage,
  describeCoverTag,
  describeDate,
} from "~/features/patients/utilities/patient-presentation";
import {
  toCoverageChanges,
  toCoverageFormValues,
  toCoverageRequest,
} from "~/features/patients/utilities/patient-requests";
import { readLatestCardPhotos } from "~/features/patients/utilities/document-access";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { describeBranchClockTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const NOT_RECORDED = "Not recorded";

function labelOf(
  options: readonly { value: string; label: string }[],
  value: string | null
): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}

function describeValidity(coverage: PatientCoverage): string {
  if (coverage.validFrom && coverage.validUntil) {
    return `${describeDate(coverage.validFrom)} to ${describeDate(coverage.validUntil)}`;
  }
  if (coverage.validUntil) return `Until ${describeDate(coverage.validUntil)}`;
  if (coverage.validFrom) return `From ${describeDate(coverage.validFrom)}`;
  return NOT_RECORDED;
}

function describeEligibilityCheck(coverage: PatientCoverage): string {
  if (!coverage.eligibilityCheckedAt) return "Never checked";
  const checked = `Checked ${describeDate(coverage.eligibilityCheckedAt)} at ${describeBranchClockTime(coverage.eligibilityCheckedAt)}`;
  return [
    checked,
    coverage.eligibilityReference
      ? `reference ${coverage.eligibilityReference}`
      : null,
    coverage.eligibilityNote,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** HMO, NHIA, state scheme and employer cover; the primary one is used first. */
export function CoverageSection({ patientId }: { patientId: string }) {
  const { permissions } = useWorkspace();
  const canEdit = permissions.includes(PATIENT_PERMISSIONS.update);
  const coverageQuery = useCoverage(patientId);
  const actions = useCoverageActions(patientId);
  const [editing, setEditing] = useState<
    { kind: "new" } | { kind: "existing"; coverage: PatientCoverage } | null
  >(null);
  const [checkingCoverage, setCheckingCoverage] =
    useState<PatientCoverage | null>(null);
  const [endingCoverage, setEndingCoverage] = useState<PatientCoverage | null>(
    null
  );
  const [photographingCoverage, setPhotographingCoverage] =
    useState<PatientCoverage | null>(null);
  const documentsQuery = useDocuments(patientId);
  const { mutation: openMutation, openDocument } = useOpenDocument(patientId);
  const cardPhotoByCoverage = readLatestCardPhotos(documentsQuery.data ?? []);

  const activeCoverage = (coverageQuery.data ?? []).filter(
    (coverage) => coverage.status === "ACTIVE"
  );
  const endedCount = (coverageQuery.data ?? []).length - activeCoverage.length;

  function makePrimary(coverage: PatientCoverage) {
    actions.update.mutate(
      { coverage, changes: { isPrimary: true } },
      {
        onSuccess: () =>
          announceSuccess(`${describeCoverage(coverage)} is now primary`),
      }
    );
  }

  return (
    <ContentPanel
      heading="Insurance cover"
      headingLevel={2}
      description="The primary cover is used first at the desk and at checkout. Without cover, the patient pays themselves."
      headingAccessory={
        canEdit && (
          <ActionButton
            type="button"
            variant="outline"
            size="small"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => {
              actions.add.reset();
              setEditing({ kind: "new" });
            }}
          >
            Add cover
          </ActionButton>
        )
      }
    >
      {coverageQuery.isPending ? (
        <LoadingPlaceholder label="Loading cover" rows={[{ shape: "card" }]} />
      ) : coverageQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load the cover"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void coverageQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{coverageQuery.error.message}</p>
        </StateNotice>
      ) : activeCoverage.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Self-pay: no insurance or scheme cover recorded
          {endedCount > 0 ? ` (${endedCount} ended)` : ""}.
        </p>
      ) : (
        <ScrollRegion accessibleLabel="Insurance cover" size="large">
          <ul className="flex flex-col gap-4">
            {activeCoverage.map((coverage) => {
              const coverTag = describeCoverTag(coverage);
              return (
                <li
                  key={coverage.id}
                  className="flex flex-col gap-4 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {describeCoverage(coverage)}
                      </span>
                      {coverage.isPrimary && (
                        <StatusLabel {...COVER_TAGS.primary} />
                      )}
                      <StatusLabel {...coverTag} />
                    </div>
                    {canEdit && (
                      <ActionMenu
                        accessibleLabel={`Actions for ${describeCoverage(coverage)}`}
                        className="-mr-2 -mt-1"
                        items={[
                          {
                            label: "Record a cover check",
                            icon: <EligibilityCheckIcon />,
                            onSelect: () => setCheckingCoverage(coverage),
                          },
                          {
                            label: cardPhotoByCoverage.has(coverage.id)
                              ? "Replace card photo"
                              : "Add card photo",
                            icon: <AddCardPhotoIcon />,
                            onSelect: () => setPhotographingCoverage(coverage),
                          },
                          {
                            label: "Edit",
                            icon: <EditIcon />,
                            onSelect: () => {
                              actions.update.reset();
                              setEditing({ kind: "existing", coverage });
                            },
                          },
                          ...(coverage.isPrimary
                            ? []
                            : [
                                {
                                  label: "Make primary",
                                  icon: <PreferredIcon />,
                                  onSelect: () => makePrimary(coverage),
                                  isPending:
                                    actions.update.isPending &&
                                    actions.update.variables.coverage.id ===
                                      coverage.id,
                                  pendingLabel: "Saving",
                                },
                              ]),
                          {
                            label: "End cover",
                            icon: <EndCoverIcon />,
                            tone: "destructive",
                            separatedAbove: true,
                            onSelect: () => {
                              actions.update.reset();
                              setEndingCoverage(coverage);
                            },
                          },
                        ]}
                      />
                    )}
                  </div>
                  <DetailList
                    items={[
                      {
                        term: "Kind",
                        description:
                          labelOf(PAYER_TYPE_OPTIONS, coverage.payerType) ??
                          coverage.payerType,
                      },
                      {
                        term: "Member number",
                        description: coverage.memberNumber,
                      },
                      {
                        term: "Covered as",
                        description: `${
                          labelOf(
                            COVERAGE_RELATIONSHIP_OPTIONS,
                            coverage.relationship
                          ) ?? coverage.relationship
                        }${coverage.principalName ? ` (${coverage.principalName})` : ""}`,
                      },
                      ...(coverage.employerName
                        ? [
                            {
                              term: "Employer",
                              description: coverage.employerName,
                            },
                          ]
                        : []),
                      {
                        term: "Valid",
                        description: describeValidity(coverage),
                      },
                      {
                        term: "Last check",
                        description: describeEligibilityCheck(coverage),
                      },
                      {
                        term: "Card photo",
                        description: cardPhotoByCoverage.has(coverage.id) ? (
                          <ActionButton
                            type="button"
                            variant="link"
                            size="small"
                            className="h-auto p-0"
                            leadingIcon={
                              <OpenDocumentIcon className="size-4" />
                            }
                            isLoading={
                              openMutation.isPending &&
                              openMutation.variables ===
                                cardPhotoByCoverage.get(coverage.id)?.id
                            }
                            loadingText="Opening"
                            onClick={() => {
                              const cardPhoto = cardPhotoByCoverage.get(
                                coverage.id
                              );
                              if (cardPhoto) openDocument(cardPhoto.id);
                            }}
                          >
                            Open card photo
                          </ActionButton>
                        ) : (
                          NOT_RECORDED
                        ),
                      },
                    ]}
                  />
                  {openMutation.isError &&
                    openMutation.variables ===
                      cardPhotoByCoverage.get(coverage.id)?.id && (
                      <NoticeBanner
                        tone="error"
                        title="The card photo did not open"
                      >
                        {openMutation.error.message}
                      </NoticeBanner>
                    )}
                </li>
              );
            })}
          </ul>
        </ScrollRegion>
      )}
      {actions.update.isError && !editing && !endingCoverage && (
        <NoticeBanner tone="error" title="That was not saved">
          {actions.update.error.message}
        </NoticeBanner>
      )}
      {canEdit && (
        <>
          <CoverageDialog
            editing={editing}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            actions={actions}
          />
          <EligibilityDialog
            patientId={patientId}
            coverage={checkingCoverage}
            onOpenChange={(open) => {
              if (!open) setCheckingCoverage(null);
            }}
          />
          <UploadDocumentDialog
            patientId={patientId}
            open={photographingCoverage !== null}
            onOpenChange={(open) => {
              if (!open) setPhotographingCoverage(null);
            }}
            preset={
              photographingCoverage
                ? {
                    category: "HMO_CARD",
                    title: `Card photo: ${describeCoverage(photographingCoverage)}`,
                    coverageId: photographingCoverage.id,
                    dialogTitle: `Card photo for ${describeCoverage(photographingCoverage)}`,
                    successMessage: "Card photo added",
                  }
                : undefined
            }
          />
          <FormDialog
            open={endingCoverage !== null}
            onOpenChange={(open) => {
              if (!open) setEndingCoverage(null);
            }}
            title={
              endingCoverage
                ? `End ${describeCoverage(endingCoverage)}?`
                : "End cover?"
            }
            description="For a plan the patient no longer has. It stays in the record's history."
            submitLabel="End cover"
            submittingLabel="Ending"
            tone="destructive"
            isSubmitting={actions.update.isPending}
            error={actions.update.error?.message}
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              if (!endingCoverage) return;
              actions.update.mutate(
                { coverage: endingCoverage, changes: { status: "ENDED" } },
                {
                  onSuccess: () => {
                    announceSuccess("Cover ended");
                    setEndingCoverage(null);
                  },
                }
              );
            }}
          >
            {null}
          </FormDialog>
        </>
      )}
    </ContentPanel>
  );
}

const COVERAGE_FIELD_IDENTIFIERS: Record<keyof CoverageFormValues, string> = {
  payerType: "coverage-payer-type",
  payerName: "coverage-payer-name",
  planName: "coverage-plan-name",
  memberNumber: "coverage-member-number",
  relationship: "coverage-relationship",
  principalName: "coverage-principal-name",
  employerName: "coverage-employer-name",
  validFrom: "coverage-valid-from",
  validUntil: "coverage-valid-until",
  isPrimary: "coverage-primary",
};

function CoverageDialog({
  editing,
  onOpenChange,
  actions,
}: {
  editing:
    { kind: "new" } | { kind: "existing"; coverage: PatientCoverage } | null;
  onOpenChange: (open: boolean) => void;
  actions: ReturnType<typeof useCoverageActions>;
}) {
  const existingCoverage =
    editing?.kind === "existing" ? editing.coverage : null;
  const mutation = existingCoverage ? actions.update : actions.add;
  const form = useForm<CoverageFormValues>({
    resolver: zodResolver(coverageFormSchema),
    defaultValues: toCoverageFormValues(null),
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const relationship = form.watch("relationship");
  const isVersionConflict =
    mutation.error instanceof PlatformApiError &&
    mutation.error.code === "VERSION_CONFLICT";

  useEffect(() => {
    if (editing) form.reset(toCoverageFormValues(existingCoverage));
    // Reset only when the dialog opens for a cover.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function onSaved(message: string) {
    announceSuccess(message);
    onOpenChange(false);
  }

  const submit = form.handleSubmit(
    (values) => {
      const fieldNames: (keyof CoverageFormValues)[] = [
        "payerType",
        "payerName",
        "planName",
        "memberNumber",
        "relationship",
        "principalName",
        "employerName",
        "validFrom",
        "validUntil",
      ];
      if (existingCoverage) {
        const changes = toCoverageChanges(existingCoverage, values);
        if (Object.keys(changes).length === 0) {
          onOpenChange(false);
          return;
        }
        actions.update.mutate(
          { coverage: existingCoverage, changes },
          {
            onSuccess: () => onSaved("Cover saved"),
            onError: (error) =>
              applyFieldErrors(error, form.setError, fieldNames),
          }
        );
        return;
      }
      actions.add.mutate(toCoverageRequest(values), {
        onSuccess: (coverage) => onSaved(`${describeCoverage(coverage)} added`),
        onError: (error) => applyFieldErrors(error, form.setError, fieldNames),
      });
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, COVERAGE_FIELD_IDENTIFIERS)
  );

  return (
    <FormDialog
      open={editing !== null}
      onOpenChange={onOpenChange}
      title={existingCoverage ? "Edit cover" : "Add cover"}
      description={
        existingCoverage
          ? "Changing the payer or membership number means the cover needs checking again."
          : "From the patient's card. The first cover added becomes the primary one."
      }
      submitLabel={existingCoverage ? "Save cover" : "Add cover"}
      submittingLabel="Saving"
      isSubmitting={mutation.isPending}
      error={
        mutation.isError &&
        !isVersionConflict &&
        Object.keys(errors).length === 0
          ? mutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      {isVersionConflict && (
        <NoticeBanner tone="warning" title="Someone else saved first">
          Close this, check the latest cover and make your change again.
        </NoticeBanner>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="payerType"
          render={({ field }) => (
            <SelectField
              id={COVERAGE_FIELD_IDENTIFIERS.payerType}
              label="Kind of cover"
              required
              placeholder="Choose"
              options={PAYER_TYPE_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.payerType?.message}
            />
          )}
        />
        <TextField
          id={COVERAGE_FIELD_IDENTIFIERS.payerName}
          label="Payer"
          required
          description="Such as Reliance HMO or NHIA."
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.payerName.maximum}
          error={errors.payerName?.message}
          {...form.register("payerName")}
        />
        <TextField
          id={COVERAGE_FIELD_IDENTIFIERS.memberNumber}
          label="Membership number"
          required
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.memberNumber.maximum}
          error={errors.memberNumber?.message}
          {...form.register("memberNumber")}
        />
        <TextField
          id={COVERAGE_FIELD_IDENTIFIERS.planName}
          label="Plan"
          description="Such as Gold or Family plus."
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.planName}
          error={errors.planName?.message}
          {...form.register("planName")}
        />
        <Controller
          control={form.control}
          name="relationship"
          render={({ field }) => (
            <SelectField
              id={COVERAGE_FIELD_IDENTIFIERS.relationship}
              label="Covered as"
              required
              placeholder="Choose"
              options={COVERAGE_RELATIONSHIP_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.relationship?.message}
            />
          )}
        />
        {relationship !== "SELF" && (
          <TextField
            id={COVERAGE_FIELD_IDENTIFIERS.principalName}
            label="Member's name"
            required
            description="The person who holds the plan."
            autoComplete="off"
            maxLength={PATIENT_FIELD_LIMITS.principalName}
            error={errors.principalName?.message}
            {...form.register("principalName")}
          />
        )}
        <TextField
          id={COVERAGE_FIELD_IDENTIFIERS.employerName}
          label="Employer"
          autoComplete="off"
          maxLength={PATIENT_FIELD_LIMITS.employerName}
          error={errors.employerName?.message}
          {...form.register("employerName")}
        />
        <Controller
          control={form.control}
          name="validFrom"
          render={({ field }) => (
            <DatePickerField
              id={COVERAGE_FIELD_IDENTIFIERS.validFrom}
              label="Valid from"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.validFrom?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="validUntil"
          render={({ field }) => (
            <DatePickerField
              id={COVERAGE_FIELD_IDENTIFIERS.validUntil}
              label="Valid until"
              value={field.value}
              onValueChange={field.onChange}
              error={errors.validUntil?.message}
            />
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="isPrimary"
        render={({ field }) => (
          <CheckboxField
            id={COVERAGE_FIELD_IDENTIFIERS.isPrimary}
            label="Primary cover"
            description="Used first at the desk and at checkout."
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </FormDialog>
  );
}
