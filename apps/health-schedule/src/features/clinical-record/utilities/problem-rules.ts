import type { ProblemFormValues } from "~/features/clinical-record/schemas/clinical-record-form-schemas";
import type { Problem } from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import type { CreateProblemRequest } from "~/features/clinical-record/services/problem-service";

/**
 * The request for a new problem: an ICD-11 code, whose title the API takes
 * from its list, or a title in words.
 */
export function toCreateProblemRequest(
  values: ProblemFormValues,
  link: { id: string; visitId?: string; noteId?: string }
): CreateProblemRequest {
  return {
    id: link.id,
    ...(values.entry === "code"
      ? { code: values.code }
      : { title: values.title.trim() }),
    ...(values.onsetDate && { onsetDate: values.onsetDate }),
    ...(values.notes.trim() && { notes: values.notes.trim() }),
    ...(link.visitId && { visitId: link.visitId }),
    ...(link.noteId && { noteId: link.noteId }),
  };
}

/** Problems in force first, then resolved ones, then entries in error. */
export function orderProblems(problems: readonly Problem[]): Problem[] {
  const rank = { ACTIVE: 0, RESOLVED: 1, ENTERED_IN_ERROR: 2 } as const;
  return [...problems].sort(
    (first, second) =>
      rank[first.status] - rank[second.status] ||
      second.createdAt.localeCompare(first.createdAt)
  );
}

/** "ICD-11 1F40.Z" or nothing for a problem described in words. */
export function describeProblemCode(problem: Problem): string | null {
  return problem.code ? `${problem.system ?? "ICD-11"} ${problem.code}` : null;
}
