"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { ChevronLeftIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { RecordTabs } from "@healthalyst/ui/components/record-tabs";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { AllergiesSection } from "~/features/patients/components/allergies-section";
import { ConsentsSection } from "~/features/patients/components/consents-section";
import { CoverageSection } from "~/features/patients/components/coverage-section";
import { DocumentsSection } from "~/features/patients/components/documents-section";
import { DuplicatesPanel } from "~/features/patients/components/duplicates-panel";
import { FamilySection } from "~/features/patients/components/family-section";
import { PatientBanner } from "~/features/patients/components/patient-banner";
import { PatientDetailsSection } from "~/features/patients/components/patient-details-section";
import {
  PATIENT_PERMISSIONS,
  PATIENT_RECORD_SECTIONS,
} from "~/features/patients/config/patients";
import {
  useDocuments,
  useRelationships,
} from "~/features/patients/hooks/use-patient-record-sections";
import { usePatientDetail } from "~/features/patients/hooks/use-patients";
import { readRecordSection } from "~/features/patients/utilities/record-section";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const NOT_FOUND_CODES = ["PATIENT_NOT_FOUND", "NOT_FOUND"];

/**
 * One patient's record: the banner, then tabs for the overview, family and
 * contacts, consents and documents. The open tab is kept in the address as
 * `?section=`, so it survives a reload and can be shared.
 */
export function PatientRecordPage({ patientId }: { patientId: string }) {
  const { permissions } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const searchParameters = useSearchParams();
  const section = readRecordSection(searchParameters.get("section"));
  const canRead = permissions.includes(PATIENT_PERMISSIONS.read);
  const patientQuery = usePatientDetail(patientId, canRead);
  const isRecordOpen = canRead && patientQuery.isSuccess;
  const relationshipsQuery = useRelationships(patientId, isRecordOpen);
  const documentsQuery = useDocuments(patientId, isRecordOpen);

  function openSection(nextSection: string) {
    const nextParameters = new URLSearchParams(searchParameters.toString());
    if (nextSection === PATIENT_RECORD_SECTIONS[0].value) {
      nextParameters.delete("section");
    } else {
      nextParameters.set("section", nextSection);
    }
    const query = nextParameters.toString();
    // The tabs are already on the page: change the address without asking
    // the server for the page again.
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname
    );
  }
  const patient = patientQuery.data;
  const mergedIntoId =
    patient?.status === "MERGED" ? patient.mergedIntoId : null;

  // A merged record was a duplicate: open the record it was merged into.
  useEffect(() => {
    if (mergedIntoId) {
      router.replace(HEALTH_SCHEDULE_ROUTES.patient(mergedIntoId));
    }
  }, [mergedIntoId, router]);

  const backLink = (
    <Link
      href={HEALTH_SCHEDULE_ROUTES.patients}
      className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ChevronLeftIcon aria-hidden="true" className="size-4" />
      Patients
    </Link>
  );

  if (!canRead) {
    return (
      <StateNotice tone="information" title="Your role cannot see patients">
        <p>
          Ask an organisation administrator to add the “Search patients”
          permission to your role.
        </p>
      </StateNotice>
    );
  }

  if (patientQuery.isPending || mergedIntoId) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <LoadingPlaceholder
          label={
            mergedIntoId
              ? "Opening the record this one was merged into"
              : "Opening the record"
          }
          rows={[{ shape: "card" }, { shape: "card" }, { shape: "card" }]}
        />
      </div>
    );
  }

  if (patientQuery.isError) {
    const isNotFound =
      patientQuery.error instanceof PlatformApiError &&
      NOT_FOUND_CODES.includes(patientQuery.error.code ?? "");
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <StateNotice
          tone="error"
          title={
            isNotFound
              ? "There is no such patient"
              : "We could not open this record"
          }
          action={
            !isNotFound && (
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => void patientQuery.refetch()}
              >
                Try again
              </ActionButton>
            )
          }
        >
          <p>
            {isNotFound
              ? "The record may belong to another organisation, or the link is wrong. Search for the patient instead."
              : patientQuery.error.message}
          </p>
        </StateNotice>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {backLink}
      <PatientBanner patient={patientQuery.data} />
      <RecordTabs
        accessibleLabel="Patient record sections"
        value={section}
        onValueChange={openSection}
        tabs={PATIENT_RECORD_SECTIONS.map((recordSection) => ({
          value: recordSection.value,
          label: recordSection.label,
          count:
            recordSection.value === "family"
              ? relationshipsQuery.data?.length
              : recordSection.value === "documents"
                ? documentsQuery.data?.filter(
                    (document) => document.status !== "REMOVED"
                  ).length
                : undefined,
          content:
            recordSection.value === "family" ? (
              <FamilySection patientId={patientId} />
            ) : recordSection.value === "consents" ? (
              <ConsentsSection patient={patientQuery.data} />
            ) : recordSection.value === "documents" ? (
              <DocumentsSection patientId={patientId} />
            ) : (
              <div className="flex flex-col gap-6">
                <DuplicatesPanel patient={patientQuery.data} />
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <PatientDetailsSection patient={patientQuery.data} />
                  <div className="flex flex-col gap-6">
                    <AllergiesSection patientId={patientId} />
                    <CoverageSection patientId={patientId} />
                  </div>
                </div>
              </div>
            ),
        }))}
      />
    </div>
  );
}
