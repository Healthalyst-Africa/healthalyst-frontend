"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RevokeIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { ExpandableSection } from "@healthalyst/ui/components/expandable-section";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { FormSection } from "@healthalyst/ui/components/form-section";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  CONSENT_FIELD_LIMITS,
  CONSENT_METHOD_OPTIONS,
  CONSENT_TYPES,
  CONTACT_LANGUAGE_OPTIONS,
  PATIENT_PERMISSIONS,
} from "~/features/patients/config/patients";
import {
  useConsentActions,
  useConsents,
  useRelationships,
} from "~/features/patients/hooks/use-patient-record-sections";
import {
  consentFormSchema,
  revokeConsentFormSchema,
  type ConsentFormValues,
  type RevokeConsentFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type { PatientDetail } from "~/features/patients/schemas/patient-response-schemas";
import {
  describeConsentGiven,
  describeConsentWithdrawn,
  readConsentChecklist,
  type ConsentChecklistRow,
} from "~/features/patients/utilities/consent-presentation";
import { toConsentRequest } from "~/features/patients/utilities/patient-requests";
import {
  describeRelatedPerson,
  listGuardians,
} from "~/features/patients/utilities/relationship-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** What the patient has agreed to, one row per consent, with its history. */
export function ConsentsSection({ patient }: { patient: PatientDetail }) {
  const { permissions } = useWorkspace();
  const canRecord = permissions.includes(PATIENT_PERMISSIONS.consent);
  const consentsQuery = useConsents(patient.id);
  const actions = useConsentActions(patient.id);
  const [recordingRow, setRecordingRow] = useState<ConsentChecklistRow | null>(
    null
  );
  const [withdrawingRow, setWithdrawingRow] =
    useState<ConsentChecklistRow | null>(null);

  return (
    <ContentPanel
      heading="Consents"
      headingLevel={2}
      description="Ask about each one. Reminders and marketing are separate: a patient can get appointment reminders without news and offers."
    >
      {consentsQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading consents"
          rows={[{ shape: "text" }, { shape: "text" }, { shape: "text" }]}
        />
      ) : consentsQuery.isError ? (
        <StateNotice
          tone="error"
          title="We could not load the consents"
          action={
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => void consentsQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          <p>{consentsQuery.error.message}</p>
        </StateNotice>
      ) : (
        <>
          <ul className="flex flex-col divide-y rounded-lg border">
            {readConsentChecklist(consentsQuery.data).map((row) => (
              <li
                key={row.type}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {row.label}
                    <StatusLabel tone={row.isGiven ? "positive" : "neutral"}>
                      {row.isGiven
                        ? "Given"
                        : row.latestEntry?.revokedAt
                          ? "Withdrawn"
                          : "Not asked"}
                    </StatusLabel>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {row.description}
                  </span>
                  {row.activeConsent ? (
                    <span className="text-caption text-muted-foreground">
                      {describeConsentGiven(row.activeConsent)}
                    </span>
                  ) : (
                    row.latestEntry?.revokedAt && (
                      <span className="text-caption text-muted-foreground">
                        {describeConsentWithdrawn(row.latestEntry)}
                      </span>
                    )
                  )}
                </div>
                {canRecord &&
                  (row.activeConsent ? (
                    <ActionButton
                      type="button"
                      variant="outline"
                      size="small"
                      leadingIcon={<RevokeIcon className="size-4" />}
                      onClick={() => {
                        actions.revoke.reset();
                        setWithdrawingRow(row);
                      }}
                    >
                      Withdraw
                      <span className="sr-only">{` ${row.label} consent`}</span>
                    </ActionButton>
                  ) : (
                    <ActionButton
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={() => {
                        actions.record.reset();
                        setRecordingRow(row);
                      }}
                    >
                      Record consent
                      <span className="sr-only">{` for ${row.label}`}</span>
                    </ActionButton>
                  ))}
              </li>
            ))}
          </ul>
          {consentsQuery.data.history.length > 0 && (
            <ExpandableSection
              title={`History (${consentsQuery.data.history.length})`}
            >
              <ul className="flex flex-col gap-2 text-sm">
                {consentsQuery.data.history.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-0.5">
                    <span>
                      {CONSENT_TYPES.find(
                        (consentType) => consentType.value === entry.type
                      )?.label ?? entry.type}
                      {entry.revokedAt ? " (withdrawn)" : ""}
                    </span>
                    <span className="text-caption text-muted-foreground">
                      {describeConsentGiven(entry)}
                      {entry.revokedAt
                        ? `. ${describeConsentWithdrawn(entry)}`
                        : ""}
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
          <RecordConsentDialog
            patient={patient}
            row={recordingRow}
            onOpenChange={(open) => {
              if (!open) setRecordingRow(null);
            }}
            mutation={actions.record}
          />
          <WithdrawConsentDialog
            row={withdrawingRow}
            onOpenChange={(open) => {
              if (!open) setWithdrawingRow(null);
            }}
            mutation={actions.revoke}
          />
        </>
      )}
    </ContentPanel>
  );
}

const SIGNED_BY_OPTIONS = [
  { value: "PATIENT", label: "The patient" },
  { value: "GUARDIAN", label: "A guardian" },
] as const;

function RecordConsentDialog({
  patient,
  row,
  onOpenChange,
  mutation,
}: {
  patient: PatientDetail;
  row: ConsentChecklistRow | null;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useConsentActions>["record"];
}) {
  const relationshipsQuery = useRelationships(patient.id, row !== null);
  const guardians = listGuardians(relationshipsQuery.data ?? []);
  const emptyValues: ConsentFormValues = {
    method: "",
    language: patient.preferredLanguage ?? CONTACT_LANGUAGE_OPTIONS[0].value,
    signedBy: "PATIENT",
    guardianRelationshipId: "",
    signerName: "",
    witnessName: "",
    notes: "",
  };
  const form = useForm<ConsentFormValues>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: emptyValues,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const signedBy = form.watch("signedBy");
  const method = form.watch("method");
  const isSigned = method === "WRITTEN" || method === "ELECTRONIC_SIGNATURE";

  useEffect(() => {
    if (row) form.reset(emptyValues);
    // Reset only when a different consent is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  const submit = form.handleSubmit(
    (values) => {
      if (!row) return;
      mutation.mutate(toConsentRequest(row.type, values), {
        onSuccess: () => {
          announceSuccess(`Consent recorded: ${row.label}`);
          onOpenChange(false);
        },
        onError: (error) =>
          applyFieldErrors(error, form.setError, [
            "method",
            "language",
            "signedBy",
            "guardianRelationshipId",
            "signerName",
            "witnessName",
            "notes",
          ]),
      });
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        method: "consent-method",
        language: "consent-language",
        signedBy: "consent-signed-by",
        guardianRelationshipId: "consent-guardian",
        signerName: "consent-signer-name",
        witnessName: "consent-witness-name",
        notes: "consent-notes",
      })
  );

  return (
    <FormDialog
      open={row !== null}
      onOpenChange={onOpenChange}
      size="wide"
      title={row ? `Record consent: ${row.label}` : "Record consent"}
      description={row?.description}
      submitLabel="Record consent"
      submittingLabel="Recording"
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
        name="method"
        render={({ field }) => (
          <ChoiceCardGroup
            id="consent-method"
            legend="How was consent given?"
            required
            options={CONSENT_METHOD_OPTIONS}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.method?.message}
          />
        )}
      />
      <FormSection title="Who agreed">
        <Controller
          control={form.control}
          name="signedBy"
          render={({ field }) => (
            <ChoiceCardGroup
              id="consent-signed-by"
              legend="Given by"
              required
              layout="stack"
              options={SIGNED_BY_OPTIONS.map((option) =>
                option.value === "GUARDIAN" && guardians.length === 0
                  ? {
                      ...option,
                      disabled: true,
                      description:
                        "Add a guardian under Family and contacts first.",
                    }
                  : option
              )}
              value={field.value}
              onValueChange={(value) => {
                const isGuardian = value === "GUARDIAN";
                field.onChange(isGuardian ? "GUARDIAN" : "PATIENT");
                // With only one guardian, there is nobody else to choose.
                const onlyGuardian =
                  guardians.length === 1 ? guardians[0] : null;
                if (isGuardian && onlyGuardian) {
                  form.setValue("guardianRelationshipId", onlyGuardian.id);
                }
              }}
            />
          )}
        />
        <div className="flex flex-col gap-4">
          {signedBy === "GUARDIAN" && (
            <Controller
              control={form.control}
              name="guardianRelationshipId"
              render={({ field }) => (
                <SelectField
                  id="consent-guardian"
                  label="Guardian"
                  required
                  placeholder="Choose"
                  options={guardians.map((guardian) => ({
                    value: guardian.id,
                    label: describeRelatedPerson(guardian),
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.guardianRelationshipId?.message}
                />
              )}
            />
          )}
          <Controller
            control={form.control}
            name="language"
            render={({ field }) => (
              <SelectField
                id="consent-language"
                label="Explained in"
                required
                placeholder="Choose"
                options={CONTACT_LANGUAGE_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.language?.message}
              />
            )}
          />
        </div>
      </FormSection>
      <FormSection title="Signature and witness">
        <TextField
          id="consent-signer-name"
          label="Name as signed"
          required={isSigned}
          autoComplete="off"
          maxLength={CONSENT_FIELD_LIMITS.name}
          error={errors.signerName?.message}
          {...form.register("signerName")}
        />
        <TextField
          id="consent-witness-name"
          label="Witness"
          autoComplete="off"
          maxLength={CONSENT_FIELD_LIMITS.name}
          error={errors.witnessName?.message}
          {...form.register("witnessName")}
        />
      </FormSection>
      <TextAreaField
        id="consent-notes"
        label="Notes"
        rows={2}
        maxLength={CONSENT_FIELD_LIMITS.notes}
        error={errors.notes?.message}
        {...form.register("notes")}
      />
    </FormDialog>
  );
}

const EMPTY_WITHDRAWAL: RevokeConsentFormValues = { reason: "" };

function WithdrawConsentDialog({
  row,
  onOpenChange,
  mutation,
}: {
  row: ConsentChecklistRow | null;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useConsentActions>["revoke"];
}) {
  const form = useForm<RevokeConsentFormValues>({
    resolver: zodResolver(revokeConsentFormSchema),
    defaultValues: EMPTY_WITHDRAWAL,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (row) form.reset(EMPTY_WITHDRAWAL);
    // Reset only when a different consent is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);

  const submit = form.handleSubmit(
    (values) => {
      const consent = row?.activeConsent;
      if (!row || !consent) return;
      mutation.mutate(
        { consentId: consent.id, reason: values.reason.trim() },
        {
          onSuccess: () => {
            announceSuccess(`Consent withdrawn: ${row.label}`);
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, ["reason"]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        reason: "withdraw-consent-reason",
      })
  );

  return (
    <FormDialog
      open={row !== null}
      onOpenChange={onOpenChange}
      title={row ? `Withdraw consent: ${row.label}` : "Withdraw consent"}
      description="It stops from now on and stays in the history."
      submitLabel="Withdraw consent"
      submittingLabel="Withdrawing"
      tone="destructive"
      isSubmitting={mutation.isPending}
      error={
        mutation.isError && Object.keys(errors).length === 0
          ? mutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextAreaField
        id="withdraw-consent-reason"
        label="Reason"
        required
        description="Such as “patient asked by phone to stop reminders”."
        rows={2}
        maxLength={CONSENT_FIELD_LIMITS.revokeReason.maximum}
        error={errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
