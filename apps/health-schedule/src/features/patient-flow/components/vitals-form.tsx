"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SendOnIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  ADULT_FROM_YEARS,
  CONSCIOUSNESS_OPTIONS,
  PAIN_SCORE_OPTIONS,
  TRIAGE_BAND_OPTIONS,
  TRIAGE_PERMISSIONS,
  TRIAGE_TEXT_LIMITS,
} from "~/features/patient-flow/config/triage";
import { PATIENT_FLOW_PERMISSIONS } from "~/features/patient-flow/config/patient-flow";
import {
  useQueueActions,
  useQueueEntries,
  useRecordTriage,
} from "~/features/patient-flow/hooks/use-patient-flow";
import { createTriageFormSchema } from "~/features/patient-flow/schemas/triage-form-schema";
import { PatientAllergyLine } from "~/features/patients/components/patient-banner";
import { usePatientDetail } from "~/features/patients/hooks/use-patients";
import type {
  QueueEntry,
  TriageBand,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import { describePatientName } from "~/features/patient-flow/utilities/front-desk";
import {
  decodeQueueTarget,
  type QueueTargetOption,
} from "~/features/patient-flow/utilities/queue-targets";
import {
  assessDangerSigns,
  describeOrdinal,
  hasAnyVitals,
  isAssessedAsAdult,
  needsOverride,
  predictQueuePosition,
  readBand,
  readVitals,
  suggestBand,
  toTriageRequest,
  type TriageFormValues,
  type VitalSignName,
} from "~/features/patient-flow/utilities/triage-assessment";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const EMPTY_VALUES: TriageFormValues = {
  complaint: "",
  temperatureC: "",
  heartRate: "",
  respiratoryRate: "",
  systolicBp: "",
  diastolicBp: "",
  spo2: "",
  consciousness: "",
  painScore: "",
  glucoseMmolL: "",
  weightKg: "",
  heightCm: "",
  band: "",
  overrideReason: "",
  notes: "",
};

const FIELD_IDENTIFIERS: Record<keyof TriageFormValues, string> = {
  complaint: "triage-complaint",
  temperatureC: "triage-temperature",
  heartRate: "triage-pulse",
  respiratoryRate: "triage-breathing-rate",
  systolicBp: "triage-systolic",
  diastolicBp: "triage-diastolic",
  spo2: "triage-oxygen",
  consciousness: "triage-consciousness",
  painScore: "triage-pain",
  glucoseMmolL: "triage-glucose",
  weightKg: "triage-weight",
  heightCm: "triage-height",
  band: "triage-band",
  overrideReason: "triage-override-reason",
  notes: "triage-notes",
};

const NUMBER_FIELDS: readonly {
  name: VitalSignName;
  label: string;
  inputMode: "numeric" | "decimal";
}[] = [
  { name: "temperatureC", label: "Temperature (°C)", inputMode: "decimal" },
  { name: "heartRate", label: "Pulse (per minute)", inputMode: "numeric" },
  {
    name: "respiratoryRate",
    label: "Breathing rate (per minute)",
    inputMode: "numeric",
  },
  {
    name: "systolicBp",
    label: "Blood pressure, upper (mmHg)",
    inputMode: "numeric",
  },
  {
    name: "diastolicBp",
    label: "Blood pressure, lower (mmHg)",
    inputMode: "numeric",
  },
  { name: "spo2", label: "Oxygen saturation (%)", inputMode: "numeric" },
];

const EXTRA_NUMBER_FIELDS: typeof NUMBER_FIELDS = [
  {
    name: "glucoseMmolL",
    label: "Blood glucose (mmol/L)",
    inputMode: "decimal",
  },
  { name: "weightKg", label: "Weight (kg)", inputMode: "decimal" },
  { name: "heightCm", label: "Height (cm)", inputMode: "decimal" },
];

const BAND_LABELS: Record<TriageBand, string> = {
  RED: "Emergency",
  YELLOW: "Urgent",
  GREEN: "Routine",
};

/**
 * Vitals for one patient: the danger signs and suggested band update as
 * they are typed, then one action saves the triage and sends the patient to
 * the doctor's queue at their new priority.
 */
export function VitalsForm({
  entry,
  branchId,
  doctorOptions,
  defaultDoctorValue,
  onFinished,
}: {
  entry: QueueEntry;
  branchId: string;
  /** Next free doctor, then each doctor working today. */
  doctorOptions: readonly QueueTargetOption[];
  /** The doctor the patient booked with, or the next free doctor. */
  defaultDoctorValue: string;
  /** Called once the patient is saved and, if chosen, sent on. */
  onFinished: () => void;
}) {
  const { permissions } = useWorkspace();
  const canOverride = permissions.includes(TRIAGE_PERMISSIONS.override);
  const canSendOn = permissions.includes(PATIENT_FLOW_PERMISSIONS.manageQueues);
  const canReadPatients = permissions.includes(
    PATIENT_FLOW_PERMISSIONS.readPatients
  );
  const patientName = describePatientName(entry.patient);
  const patientRecordQuery = usePatientDetail(
    entry.patient.id,
    canReadPatients
  );
  // An unknown age is assessed, as the API does.
  const isAdult = isAssessedAsAdult(
    patientRecordQuery.data?.dateOfBirth ?? null
  );
  const schema = useMemo(
    () => createTriageFormSchema({ isAdult, currentBand: entry.triageBand }),
    [isAdult, entry.triageBand]
  );
  const form = useForm<TriageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...EMPTY_VALUES, band: entry.triageBand ?? "" },
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const values = form.watch();
  const [hasChosenBand, setHasChosenBand] = useState(entry.triageBand !== null);
  const [doctorValue, setDoctorValue] = useState(defaultDoctorValue);
  const [sendFailure, setSendFailure] = useState<string | null>(null);

  const recordMutation = useRecordTriage();
  const queueActions = useQueueActions(branchId);
  const doctorTarget = decodeQueueTarget(doctorValue);
  const doctorQueueQuery = useQueueEntries(
    branchId,
    doctorTarget ?? { kind: "CONSULTATION" },
    canSendOn && doctorTarget !== null
  );

  const vitals = readVitals(values);
  const assessment = isAdult
    ? assessDangerSigns(vitals)
    : { dangerSigns: [], suggestedBand: null };
  const suggestedBand = suggestBand({ vitals, isAdult });
  // The band follows the suggestion until the nurse picks one.
  useEffect(() => {
    if (!hasChosenBand) form.setValue("band", suggestedBand ?? "");
  }, [form, hasChosenBand, suggestedBand]);
  const band = readBand(values.band);
  const overrideNeeded = needsOverride({
    band: values.band,
    suggestedBand: assessment.suggestedBand,
    currentBand: entry.triageBand,
  });
  const lowerThanRedBlocked =
    !canOverride &&
    (assessment.suggestedBand === "RED" || entry.triageBand === "RED");

  const doctorLabel =
    doctorOptions.find((option) => option.value === doctorValue)?.label ??
    "the doctor";
  const waitingBands = (doctorQueueQuery.data ?? [])
    .filter((queuedEntry) => queuedEntry.status === "WAITING")
    .filter((queuedEntry) => queuedEntry.visitId !== entry.visitId)
    .map((queuedEntry) => queuedEntry.triageBand);
  const queuePosition = band ? predictQueuePosition(waitingBands, band) : null;

  function sendOn() {
    if (!doctorTarget) return;
    setSendFailure(null);
    queueActions.sendOn.mutate(
      { entryId: entry.id, request: { to: doctorTarget } },
      {
        onSuccess: () => {
          announceSuccess(`${patientName} is waiting for ${doctorLabel}`);
          onFinished();
        },
        onError: (error) =>
          setSendFailure(
            `The vital signs are saved, but ${patientName} was not sent on: ${error.message}`
          ),
      }
    );
  }

  function save(shouldSendOn: boolean) {
    return form.handleSubmit(
      (formValues) => {
        recordMutation.mutate(
          {
            visitId: entry.visitId,
            request: toTriageRequest(formValues, overrideNeeded),
          },
          {
            onSuccess: (savedAssessment) => {
              announceSuccess(
                `${patientName} is triaged as ${BAND_LABELS[savedAssessment.band]}`
              );
              if (shouldSendOn && doctorTarget) {
                sendOn();
                return;
              }
              onFinished();
            },
            onError: (error) => {
              applyFieldErrors(error, form.setError, [
                "temperatureC",
                "heartRate",
                "respiratoryRate",
                "systolicBp",
                "diastolicBp",
                "spo2",
                "glucoseMmolL",
                "painScore",
                "weightKg",
                "heightCm",
                "complaint",
                "overrideReason",
                "notes",
              ]);
            },
          }
        );
      },
      (invalidFields) =>
        focusFirstInvalidField(invalidFields, FIELD_IDENTIFIERS)
    );
  }

  const isSaving = recordMutation.isPending || queueActions.sendOn.isPending;
  const sendLabel = band
    ? `Save and send to ${doctorLabel} as ${BAND_LABELS[band]}`
    : `Save and send to ${doctorLabel}`;

  return (
    <ContentPanel
      heading={`Vital signs for ${patientName}`}
      headingLevel={2}
      description={`${entry.token} · ${entry.patient.patientNumber}${entry.note ? ` · ${entry.note}` : ""}`}
    >
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(formEvent) => void save(canSendOn)(formEvent)}
      >
        {patientRecordQuery.data && (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <PatientAllergyLine patient={patientRecordQuery.data} />
          </div>
        )}
        <TextField
          id={FIELD_IDENTIFIERS.complaint}
          label="Presenting complaint"
          description="In a few words, such as “fever and cough for three days”."
          maxLength={TRIAGE_TEXT_LIMITS.complaint}
          autoComplete="off"
          error={errors.complaint?.message}
          {...form.register("complaint")}
        />

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-body font-medium">Vital signs</legend>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {NUMBER_FIELDS.map((field) => (
              <TextField
                key={field.name}
                id={FIELD_IDENTIFIERS[field.name]}
                label={field.label}
                inputMode={field.inputMode}
                autoComplete="off"
                error={errors[field.name]?.message}
                {...form.register(field.name)}
              />
            ))}
            <Controller
              control={form.control}
              name="consciousness"
              render={({ field }) => (
                <SelectField
                  id={FIELD_IDENTIFIERS.consciousness}
                  label="Consciousness"
                  placeholder="Choose"
                  options={CONSCIOUSNESS_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.consciousness?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name="painScore"
              render={({ field }) => (
                <SelectField
                  id={FIELD_IDENTIFIERS.painScore}
                  label="Pain score"
                  placeholder="Choose 0 to 10"
                  options={PAIN_SCORE_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.painScore?.message}
                />
              )}
            />
            {EXTRA_NUMBER_FIELDS.map((field) => (
              <TextField
                key={field.name}
                id={FIELD_IDENTIFIERS[field.name]}
                label={field.label}
                inputMode={field.inputMode}
                autoComplete="off"
                error={errors[field.name]?.message}
                {...form.register(field.name)}
              />
            ))}
          </div>
        </fieldset>

        {!isAdult ? (
          <NoticeBanner tone="information" title="No automatic suggestion">
            Danger signs are adult values, so they are not checked for patients
            under {ADULT_FROM_YEARS}. Choose the band from your own assessment.
          </NoticeBanner>
        ) : assessment.suggestedBand ? (
          <NoticeBanner
            tone={assessment.suggestedBand === "RED" ? "error" : "warning"}
            title={`Danger signs suggest ${BAND_LABELS[assessment.suggestedBand]}`}
          >
            <ul className="list-disc pl-5">
              {assessment.dangerSigns.map((sign) => (
                <li key={sign.code}>{sign.label}</li>
              ))}
            </ul>
          </NoticeBanner>
        ) : (
          hasAnyVitals(vitals) && (
            <NoticeBanner tone="information" title="No danger signs so far">
              The suggestion updates as you add vitals. These checks are draft
              values awaiting clinical sign-off.
            </NoticeBanner>
          )
        )}

        <Controller
          control={form.control}
          name="band"
          render={({ field }) => (
            <ChoiceCardGroup
              id={FIELD_IDENTIFIERS.band}
              legend="Triage band"
              required
              description={
                suggestedBand && !hasChosenBand
                  ? "Chosen from the danger signs. You can raise it at any time."
                  : undefined
              }
              options={TRIAGE_BAND_OPTIONS.map((option) => {
                const isBlocked = option.value !== "RED" && lowerThanRedBlocked;
                return {
                  ...option,
                  disabled: isBlocked,
                  note: isBlocked
                    ? "Only a doctor can choose this when red applies."
                    : undefined,
                };
              })}
              value={field.value}
              onValueChange={(value) => {
                setHasChosenBand(true);
                field.onChange(value);
              }}
              error={errors.band?.message}
            />
          )}
        />

        {overrideNeeded && (
          <TextAreaField
            id={FIELD_IDENTIFIERS.overrideReason}
            label="Why is the band lower than emergency?"
            required
            description="Recorded with the triage. Needed when red applies."
            rows={2}
            maxLength={TRIAGE_TEXT_LIMITS.overrideReason.maximum}
            error={errors.overrideReason?.message}
            {...form.register("overrideReason")}
          />
        )}

        <TextAreaField
          id={FIELD_IDENTIFIERS.notes}
          label="Nursing note"
          rows={3}
          maxLength={TRIAGE_TEXT_LIMITS.notes}
          error={errors.notes?.message}
          {...form.register("notes")}
        />

        {canSendOn && (
          <div className="flex flex-col gap-2">
            <SelectField
              id="triage-send-to"
              required
              label="Send to"
              placeholder="Choose a doctor"
              options={doctorOptions}
              value={doctorValue}
              onValueChange={setDoctorValue}
            />
            {queuePosition !== null && doctorQueueQuery.isSuccess && (
              <p className="text-caption text-muted-foreground">
                They will be {describeOrdinal(queuePosition)} of{" "}
                {waitingBands.length + 1} waiting for {doctorLabel}.
              </p>
            )}
          </div>
        )}

        {recordMutation.isError && Object.keys(errors).length === 0 && (
          <NoticeBanner tone="error" title="The vital signs were not saved">
            {recordMutation.error.message}
          </NoticeBanner>
        )}
        {sendFailure && (
          <NoticeBanner tone="error" title="Not sent to the doctor">
            {sendFailure}
          </NoticeBanner>
        )}

        <div className="flex flex-wrap gap-2">
          {sendFailure ? (
            <ActionButton
              type="button"
              isLoading={queueActions.sendOn.isPending}
              loadingText="Sending"
              leadingIcon={<SendOnIcon className="size-4" />}
              onClick={sendOn}
            >
              Try sending again
            </ActionButton>
          ) : (
            <>
              <ActionButton
                type="submit"
                isLoading={isSaving}
                loadingText="Saving"
                leadingIcon={
                  canSendOn ? <SendOnIcon className="size-4" /> : undefined
                }
              >
                {canSendOn ? sendLabel : "Save vital signs"}
              </ActionButton>
              {canSendOn && (
                <ActionButton
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={(clickEvent) => void save(false)(clickEvent)}
                >
                  Save only
                </ActionButton>
              )}
            </>
          )}
        </div>
      </form>
    </ContentPanel>
  );
}
