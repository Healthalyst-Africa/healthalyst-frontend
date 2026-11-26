"use client";

import { useState } from "react";
import {
  AddIcon,
  DeleteIcon,
  ReopenIcon,
  ResolvedIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ActionMenu } from "@healthalyst/ui/components/action-menu";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { DocumentsCompleteIllustration } from "@healthalyst/ui/illustrations/documents-complete-illustration";
import { ScrollRegion } from "@healthalyst/ui/components/scroll-region";
import { AddProblemDialog } from "~/features/clinical-record/components/add-problem-dialog";
import {
  CLINICAL_RECORD_LIMITS as LIMITS,
  CLINICAL_RECORD_PERMISSIONS,
  PROBLEM_STATUS_PRESENTATION,
} from "~/features/clinical-record/config/clinical-record";
import {
  useProblemActions,
  useProblems,
} from "~/features/clinical-record/hooks/use-clinical-record";
import type { Problem } from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import {
  describeProblemCode,
  orderProblems,
} from "~/features/clinical-record/utilities/problem-rules";
import { ReasonDialog } from "~/shared/forms/reason-dialog";
import { describeDate } from "~/features/patients/utilities/patient-presentation";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function describeProblemDates(problem: Problem): string | null {
  const parts = [
    problem.onsetDate && `Since ${describeDate(problem.onsetDate)}`,
    problem.resolvedDate && `Resolved ${describeDate(problem.resolvedDate)}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * The patient's problem list: diagnoses and problems in force first, then
 * resolved ones. With a visit, new problems are linked to it.
 */
export function ProblemsSection({
  patientId,
  visitId,
  noteId,
  headingLevel = 2,
}: {
  patientId: string;
  visitId?: string;
  noteId?: string;
  headingLevel?: 2 | 3;
}) {
  const { permissions } = useWorkspace();
  const canWrite = permissions.includes(CLINICAL_RECORD_PERMISSIONS.writeNotes);
  const problemsQuery = useProblems(patientId, true);
  const actions = useProblemActions(patientId);
  const [isAdding, setIsAdding] = useState(false);
  const [problemInError, setProblemInError] = useState<Problem | null>(null);
  const problems = orderProblems(problemsQuery.data ?? []);

  function changeStatus(problem: Problem, status: "ACTIVE" | "RESOLVED") {
    actions.update.mutate(
      { problem, changes: { status } },
      {
        onSuccess: (savedProblem) =>
          announceSuccess(
            status === "RESOLVED"
              ? `${savedProblem.title} resolved`
              : `${savedProblem.title} reopened`
          ),
      }
    );
  }

  return (
    <ContentPanel
      heading="Problem list"
      headingLevel={headingLevel}
      description="The patient's conditions and diagnoses, coded so they mean the same to every clinician."
      headingAccessory={
        canWrite && (
          <ActionButton
            type="button"
            variant="outline"
            size="compact"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => setIsAdding(true)}
          >
            Add a problem
          </ActionButton>
        )
      }
    >
      {problemsQuery.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Loading the problem list
        </p>
      )}
      {problemsQuery.isError && (
        <NoticeBanner
          tone="error"
          title="We could not load the problem list"
          action={
            <ActionButton
              type="button"
              variant="outline"
              size="compact"
              onClick={() => void problemsQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          {problemsQuery.error.message}
        </NoticeBanner>
      )}
      {actions.update.isError && (
        <NoticeBanner tone="error" title="The problem was not changed">
          {actions.update.error.message}
        </NoticeBanner>
      )}
      {problemsQuery.isSuccess && problems.length === 0 && (
        <EmptyState
          surface="plain"
          illustration={<DocumentsCompleteIllustration />}
          title="No problems recorded"
          description="Long-term conditions and diagnoses, such as diabetes or asthma, are listed here so every visit starts with them."
        />
      )}
      {problems.length > 0 && (
        <ScrollRegion accessibleLabel="Problems" size="medium">
          <ul className="flex flex-col divide-y divide-border">
            {problems.map((problem) => {
              const status = PROBLEM_STATUS_PRESENTATION[problem.status];
              const code = describeProblemCode(problem);
              const dates = describeProblemDates(problem);
              return (
                <li
                  key={problem.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <p
                      className={
                        problem.status === "ENTERED_IN_ERROR"
                          ? "font-medium line-through"
                          : "font-medium"
                      }
                    >
                      {problem.title}
                    </p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <StatusLabel {...status} />
                      {code && <span>{code}</span>}
                      {dates && <span>{dates}</span>}
                    </p>
                    {problem.notes && (
                      <p className="text-sm text-muted-foreground">
                        {problem.notes}
                      </p>
                    )}
                    {problem.errorReason && (
                      <p className="text-sm text-muted-foreground">
                        Entered in error: {problem.errorReason}
                      </p>
                    )}
                  </div>
                  {canWrite && problem.status !== "ENTERED_IN_ERROR" && (
                    <ActionMenu
                      accessibleLabel={`Actions for ${problem.title}`}
                      items={[
                        problem.status === "ACTIVE"
                          ? {
                              label: "Mark as resolved",
                              icon: <ResolvedIcon className="size-4" />,
                              onSelect: () => changeStatus(problem, "RESOLVED"),
                            }
                          : {
                              label: "Reopen",
                              icon: <ReopenIcon className="size-4" />,
                              onSelect: () => changeStatus(problem, "ACTIVE"),
                            },
                        {
                          label: "Mark entered in error",
                          icon: <DeleteIcon className="size-4" />,
                          tone: "destructive",
                          separatedAbove: true,
                          onSelect: () => {
                            actions.markEnteredInError.reset();
                            setProblemInError(problem);
                          },
                        },
                      ]}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </ScrollRegion>
      )}
      {canWrite && (
        <>
          <AddProblemDialog
            open={isAdding}
            onOpenChange={setIsAdding}
            patientId={patientId}
            visitId={visitId}
            noteId={noteId}
          />
          <ReasonDialog
            open={problemInError !== null}
            onOpenChange={(open) => !open && setProblemInError(null)}
            identifier="problem-entered-in-error"
            title="Mark this problem as entered in error?"
            description="It stays on the list, struck through, with your reason."
            reasonLabel="What is wrong with it"
            minimumLength={LIMITS.errorReasonMinimum}
            maximumLength={LIMITS.errorReasonMaximum}
            submitLabel="Mark entered in error"
            submittingLabel="Saving"
            tone="destructive"
            isSubmitting={actions.markEnteredInError.isPending}
            error={actions.markEnteredInError.error?.message}
            onSubmit={(reason) =>
              problemInError &&
              actions.markEnteredInError.mutate(
                { problem: problemInError, reason },
                {
                  onSuccess: () => {
                    announceSuccess("Problem marked as entered in error");
                    setProblemInError(null);
                  },
                }
              )
            }
          />
        </>
      )}
    </ContentPanel>
  );
}
