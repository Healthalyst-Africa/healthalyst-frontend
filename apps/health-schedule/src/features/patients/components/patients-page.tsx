"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterPatientIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { SearchField } from "@healthalyst/ui/components/search-field";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { RecentMergesPanel } from "~/features/patients/components/recent-merges-panel";
import { RegisterPatientDialog } from "~/features/patients/components/register-patient-dialog";
import { PATIENT_PERMISSIONS } from "~/features/patients/config/patients";
import {
  useIncompletePatients,
  usePatientSearchResults,
} from "~/features/patients/hooks/use-patients";
import type { PatientMatch } from "~/features/patients/schemas/patient-response-schemas";
import {
  describeMissingFields,
  describePatientFacts,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";
import { useDebouncedValue } from "~/shared/hooks/use-debounced-value";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const SEARCH_MINIMUM_LENGTH = 2;
const SEARCH_DELAY_MILLISECONDS = 300;

const COLUMNS: readonly DataTableColumn<PatientMatch>[] = [
  {
    key: "patient",
    label: "Patient",
    size: "wide",
    getCell: (patient) => ({
      kind: "text",
      primary: describePatientFullName(patient),
      secondary: describePatientFacts(patient).join(" · "),
    }),
  },
  {
    key: "phone",
    label: "Phone",
    getCell: (patient) => ({
      kind: "text",
      primary: patient.phone ?? "Not recorded",
    }),
  },
  {
    key: "registration",
    label: "Registration",
    size: "compact",
    getCell: (patient) =>
      patient.isTemporary
        ? { kind: "status", label: "Not yet identified", tone: "warning" }
        : patient.missingFields.length > 0
          ? {
              kind: "status",
              label: `Add ${describeMissingFields(patient.missingFields)}`,
              tone: "warning",
            }
          : { kind: "status", label: "Complete", tone: "positive" },
  },
];

/** Every patient of the organisation: find one, or register someone new. */
export function PatientsPage() {
  const { permissions } = useWorkspace();
  const router = useRouter();
  const canRead = permissions.includes(PATIENT_PERMISSIONS.read);
  const canRegister = permissions.includes(PATIENT_PERMISSIONS.create);
  const canMerge = permissions.includes(PATIENT_PERMISSIONS.merge);
  const [searchText, setSearchText] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const debouncedSearchText = useDebouncedValue(
    searchText.trim(),
    SEARCH_DELAY_MILLISECONDS
  );
  const isSearching =
    canRead && debouncedSearchText.length >= SEARCH_MINIMUM_LENGTH;
  const searchQuery = usePatientSearchResults(debouncedSearchText, isSearching);
  const incompleteQuery = useIncompletePatients(canRead && !isSearching);

  function openPatient(patient: { id: string }) {
    router.push(HEALTH_SCHEDULE_ROUTES.patient(patient.id));
  }

  const rowAction = {
    label: (patient: PatientMatch) =>
      `Open ${describePatientFullName(patient)}'s record`,
    onSelect: openPatient,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-serif text-title font-normal tracking-tight">
            Patients
          </h1>
          <p className="text-body text-muted-foreground">
            Find a patient's record, or register someone new. Every record
            opened is kept in the patient access log.
          </p>
        </div>
        {canRegister && (
          <ActionButton
            type="button"
            leadingIcon={<RegisterPatientIcon className="size-4" />}
            onClick={() => setIsRegistering(true)}
          >
            Register a patient
          </ActionButton>
        )}
      </div>

      {!canRead ? (
        <StateNotice tone="information" title="Your role cannot see patients">
          <p>
            Ask an organisation administrator to add the “Search patients”
            permission to your role.
          </p>
        </StateNotice>
      ) : (
        <ContentPanel
          data-tour="patients-search"
          heading={isSearching ? "Search results" : "Registrations to complete"}
          headingLevel={2}
          description={
            isSearching
              ? undefined
              : "Patients registered by phone or brought in unidentified, newest first. Search above to find anyone else."
          }
        >
          <SearchField
            aria-label="Search patients"
            placeholder="Name, phone, patient or folder number"
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
            autoComplete="off"
          />
          {isSearching ? (
            <DataTable
              accessibleLabel={`Patients matching ${debouncedSearchText}`}
              columns={COLUMNS}
              state={
                searchQuery.isPending
                  ? { status: "loading", label: "Searching patients" }
                  : searchQuery.isError
                    ? {
                        status: "error",
                        title: "We could not search for patients",
                        description: searchQuery.error.message,
                        retryLabel: "Try again",
                        onRetry: () => void searchQuery.refetch(),
                      }
                    : { status: "ready", rows: searchQuery.data }
              }
              getRowIdentifier={(patient) => patient.id}
              rowAction={rowAction}
              emptyState={{
                illustration: <EmptySearchIllustration />,
                title: `No patient matches “${debouncedSearchText}”`,
                description:
                  "Check the spelling, or try a phone, patient or folder number.",
              }}
            />
          ) : (
            <DataTable
              accessibleLabel="Registrations to complete"
              columns={COLUMNS}
              state={
                incompleteQuery.isPending
                  ? { status: "loading", label: "Loading registrations" }
                  : incompleteQuery.isError
                    ? {
                        status: "error",
                        title: "We could not load the registrations",
                        description: incompleteQuery.error.message,
                        retryLabel: "Try again",
                        onRetry: () => void incompleteQuery.refetch(),
                      }
                    : { status: "ready", rows: incompleteQuery.data }
              }
              getRowIdentifier={(patient) => patient.id}
              rowAction={rowAction}
              emptyState={{
                illustration: <DocumentsCompleteIllustration />,
                title: "Every registration is complete",
              }}
            />
          )}
        </ContentPanel>
      )}

      {canRead && canMerge && !isSearching && <RecentMergesPanel />}

      {canRegister && (
        <RegisterPatientDialog
          open={isRegistering}
          onOpenChange={setIsRegistering}
          initialName={searchText}
          onRegistered={openPatient}
          onChooseExisting={openPatient}
          submitLabel="Register and open record"
        />
      )}
    </div>
  );
}
