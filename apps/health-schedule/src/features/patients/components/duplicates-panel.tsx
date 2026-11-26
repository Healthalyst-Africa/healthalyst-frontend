"use client";

import { useState } from "react";
import Link from "next/link";
import { MergeRecordsIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import { MergeDialog } from "~/features/patients/components/merge-dialog";
import {
  DUPLICATE_SCORES,
  DUPLICATE_TAGS,
  PATIENT_PERMISSIONS,
} from "~/features/patients/config/patients";
import { useDuplicates } from "~/features/patients/hooks/use-patient-record-sections";
import type {
  Patient,
  PatientMatch,
} from "~/features/patients/schemas/patient-response-schemas";
import {
  describeDuplicateReasons,
  describePatientFacts,
  describePatientFullName,
} from "~/features/patients/utilities/patient-presentation";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/**
 * Other records that may be the same person, for staff who can merge
 * (owners and administrators). Shows nothing when there are none.
 */
export function DuplicatesPanel({ patient }: { patient: Patient }) {
  const { permissions } = useWorkspace();
  const canMerge = permissions.includes(PATIENT_PERMISSIONS.merge);
  const duplicatesQuery = useDuplicates(
    patient.id,
    canMerge && patient.status === "ACTIVE"
  );
  const [comparingDuplicate, setComparingDuplicate] =
    useState<PatientMatch | null>(null);
  const candidates = (duplicatesQuery.data ?? []).filter(
    (candidate) => candidate.score >= DUPLICATE_SCORES.shown
  );

  if (!canMerge || duplicatesQuery.isPending) return null;

  if (duplicatesQuery.isError) {
    return (
      <StateNotice
        tone="error"
        title="We could not check for duplicate records"
        action={
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => void duplicatesQuery.refetch()}
          >
            Try again
          </ActionButton>
        }
      >
        <p>{duplicatesQuery.error.message}</p>
      </StateNotice>
    );
  }

  if (candidates.length === 0) return null;

  return (
    <ContentPanel
      heading="Possible duplicate records"
      headingLevel={2}
      description="These records may be the same person. Compare them, and merge them if they are, so the patient has one record."
      className="border-status-warning/40"
    >
      <ul className="flex flex-col gap-3">
        {candidates.map((candidate) => {
          const name = describePatientFullName(candidate.patient);
          return (
            <li
              key={candidate.patient.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  <Link
                    href={HEALTH_SCHEDULE_ROUTES.patient(candidate.patient.id)}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {name}
                  </Link>
                  <StatusLabel
                    {...(candidate.score >= DUPLICATE_SCORES.likely
                      ? DUPLICATE_TAGS.likely
                      : DUPLICATE_TAGS.possible)}
                  />
                </span>
                <span className="text-caption text-muted-foreground">
                  {describePatientFacts(candidate.patient).join(" · ")}
                </span>
                <span className="text-caption text-muted-foreground">
                  {describeDuplicateReasons(candidate.reasons)}
                </span>
              </div>
              <ActionButton
                type="button"
                variant="outline"
                size="small"
                leadingIcon={<MergeRecordsIcon className="size-4" />}
                onClick={() => setComparingDuplicate(candidate.patient)}
              >
                Compare and merge
                <span className="sr-only">{` with ${name}`}</span>
              </ActionButton>
            </li>
          );
        })}
      </ul>
      <MergeDialog
        patient={patient}
        duplicate={comparingDuplicate}
        onOpenChange={(open) => {
          if (!open) setComparingDuplicate(null);
        }}
      />
    </ContentPanel>
  );
}
