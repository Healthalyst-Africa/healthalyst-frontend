"use client";

import { useState } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { SearchField } from "@healthalyst/ui/components/search-field";
import type { BookingPatient } from "~/features/appointments/types/booking";
import { PATIENT_SEARCH_CONFIGURATION } from "~/features/patient-flow/config/patient-flow";
import { usePatientSearch } from "~/features/patient-flow/hooks/use-patient-flow";
import {
  describePatientMatch,
  describePatientMatchName,
} from "~/features/patient-flow/utilities/front-desk";
import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";

/**
 * Finds the patient an appointment is for, by name, phone, patient number
 * or folder number. Once chosen, shows who it is with a way to change.
 */
export function PatientPicker({
  inputIdentifier,
  patient,
  onPatientChange,
  canChange,
  error,
}: {
  inputIdentifier: string;
  patient: BookingPatient | null;
  onPatientChange: (patient: BookingPatient | null) => void;
  /** False when the dialog was opened from the patient's own record. */
  canChange: boolean;
  error?: string;
}) {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(
    searchText.trim(),
    PATIENT_SEARCH_CONFIGURATION.delayMilliseconds
  );
  const isSearching =
    patient === null &&
    debouncedSearchText.length >= PATIENT_SEARCH_CONFIGURATION.minimumLength;
  const searchQuery = usePatientSearch(debouncedSearchText, isSearching);

  if (patient) {
    if (!canChange) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">Patient</span>
          <span className="font-medium">{patient.name}</span>
          {patient.details && (
            <span className="text-caption text-muted-foreground">
              {patient.details}
            </span>
          )}
        </div>
        <ActionButton
          type="button"
          variant="outline"
          size="compact"
          onClick={() => {
            onPatientChange(null);
            setSearchText("");
          }}
        >
          Choose someone else
        </ActionButton>
      </div>
    );
  }

  const matches = searchQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={inputIdentifier} className="text-sm font-medium">
        Patient
        <span aria-hidden="true" className="text-destructive">
          {" "}
          *
        </span>
      </label>
      <SearchField
        id={inputIdentifier}
        placeholder="Name, phone, patient or folder number"
        value={searchText}
        onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
        autoComplete="off"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${inputIdentifier}-error` : undefined}
      />
      {error && (
        <p id={`${inputIdentifier}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {isSearching &&
        (searchQuery.isPending ? (
          <LoadingPlaceholder
            label="Searching patients"
            rows={[{ shape: "field" }, { shape: "field" }]}
          />
        ) : searchQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {searchQuery.error.message}
          </p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No patient matches “{debouncedSearchText}”. Check the spelling or
            try a phone number. New patients are registered at the front desk
            first.
          </p>
        ) : (
          <ChoiceCardGroup
            id={`${inputIdentifier}-matches`}
            legend="Matching patients"
            layout="stack"
            maximumVisibleOptions={4}
            value=""
            onValueChange={(patientId) => {
              const match = matches.find(
                (candidate) => candidate.id === patientId
              );
              if (!match) return;
              onPatientChange({
                id: match.id,
                name: describePatientMatchName(match),
                details: `${match.patientNumber} · ${describePatientMatch(match)}`,
              });
            }}
            options={matches.map((match) => ({
              value: match.id,
              label: describePatientMatchName(match),
              description: `${match.patientNumber} · ${describePatientMatch(match)}`,
            }))}
          />
        ))}
    </div>
  );
}
