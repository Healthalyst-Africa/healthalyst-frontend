"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { DetailList } from "@healthalyst/ui/components/detail-list";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { StateNotice } from "@healthalyst/ui/components/notice-banner";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import {
  ACCESS_REVIEW_OUTCOME_OPTIONS,
  ACCESS_REVIEW_TAGS,
  SENSITIVE_RECORD_LIMITS as LIMITS,
  SENSITIVE_RECORD_PERMISSIONS,
} from "~/features/sensitive-records/config/sensitive-records";
import {
  useEmergencyAccessGrants,
  useReviewEmergencyAccess,
} from "~/features/sensitive-records/hooks/use-sensitive-records";
import type { ReviewableGrant } from "~/features/sensitive-records/schemas/sensitive-record-response-schemas";
import { useStaffNames } from "~/shared/staff/staff-directory";
import { describeBranchDateTime } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const REVIEW_FILTER_OPTIONS = [{ value: "all", label: "Every access" }];

const reviewFormSchema = z.object({
  outcome: z.enum(["JUSTIFIED", "NOT_JUSTIFIED"], {
    error: "Choose whether the access was justified.",
  }),
  note: z
    .string()
    .trim()
    .min(
      LIMITS.reviewNoteMinimum,
      `Write a note of at least ${LIMITS.reviewNoteMinimum} characters.`
    )
    .max(
      LIMITS.reviewNoteMaximum,
      `Use ${LIMITS.reviewNoteMaximum} characters or fewer.`
    ),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

function describePatient(grant: ReviewableGrant): string {
  return `${grant.patient.firstName} ${grant.patient.lastName}`;
}

function describeReviewState(grant: ReviewableGrant) {
  if (!grant.review) return ACCESS_REVIEW_TAGS.waiting;
  return grant.review.outcome === "JUSTIFIED"
    ? ACCESS_REVIEW_TAGS.justified
    : ACCESS_REVIEW_TAGS.notJustified;
}

function ReviewForm({
  grant,
  onReviewed,
}: {
  grant: ReviewableGrant;
  onReviewed: () => void;
}) {
  const reviewMutation = useReviewEmergencyAccess();
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    form.reset({ note: "" });
    reviewMutation.reset();
    // Start again for each access opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grant.id]);

  const submit = form.handleSubmit((values) =>
    reviewMutation.mutate(
      { grantId: grant.id, ...values },
      {
        onSuccess: () => {
          announceSuccess("Review saved");
          onReviewed();
        },
      }
    )
  );

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="outcome"
        render={({ field }) => (
          <ChoiceCardGroup
            id="access-review-outcome"
            legend="Was the access justified?"
            required
            options={ACCESS_REVIEW_OUTCOME_OPTIONS.map((option) => ({
              ...option,
              tone: option.value === "NOT_JUSTIFIED" ? "negative" : "positive",
            }))}
            value={field.value ?? ""}
            onValueChange={(value) =>
              field.onChange(value as ReviewFormValues["outcome"])
            }
            error={form.formState.errors.outcome?.message}
          />
        )}
      />
      <TextAreaField
        id="access-review-note"
        label="Review note"
        description="Say what you checked, such as the patient's visit that day."
        required
        maxLength={LIMITS.reviewNoteMaximum}
        error={form.formState.errors.note?.message}
        {...form.register("note")}
      />
      {reviewMutation.isError && (
        <FormMessage tone="error">{reviewMutation.error.message}</FormMessage>
      )}
      <ActionButton
        type="submit"
        className="self-start"
        isLoading={reviewMutation.isPending}
        loadingText="Saving review"
      >
        Save review
      </ActionButton>
    </form>
  );
}

/**
 * Emergency access to restricted records, for managers to review whether
 * each was needed. Needs `audit:read`.
 */
export function AccessReviewsPage() {
  const { permissions } = useWorkspace();
  const describeStaff = useStaffNames();
  const canReview = permissions.includes(
    SENSITIVE_RECORD_PERMISSIONS.reviewAccess
  );
  const [scope, setScope] = useState("");
  const onlyUnreviewed = scope === "";
  const grantsQuery = useEmergencyAccessGrants(onlyUnreviewed, canReview);
  const [openGrantIdentifier, setOpenGrantIdentifier] = useState<string | null>(
    null
  );
  const openGrant =
    grantsQuery.data?.find((grant) => grant.id === openGrantIdentifier) ?? null;

  const columns: readonly DataTableColumn<ReviewableGrant>[] = [
    {
      key: "patient",
      label: "Patient",
      size: "wide",
      getCell: (grant) => ({
        kind: "text",
        primary: describePatient(grant),
        secondary: grant.patient.patientNumber,
      }),
    },
    {
      key: "staff",
      label: "Opened by",
      getCell: (grant) => ({
        kind: "text",
        primary: describeStaff(grant.userId),
        secondary: grant.reason,
      }),
    },
    {
      key: "when",
      label: "When",
      getCell: (grant) => ({
        kind: "date",
        label: describeBranchDateTime(grant.grantedAt),
        dateTime: grant.grantedAt,
      }),
    },
    {
      key: "review",
      label: "Review",
      size: "compact",
      getCell: (grant) => ({ kind: "status", ...describeReviewState(grant) }),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="font-serif text-title font-normal tracking-tight">
          Emergency access reviews
        </h1>
        <p className="text-body text-muted-foreground">
          Clinicians outside a patient’s care team can open a restricted record
          for four hours in an emergency. Check each one was needed.
        </p>
      </div>
      {!canReview ? (
        <StateNotice
          tone="information"
          title="Your role cannot review emergency access"
        >
          <p>
            Owners, administrators and managers review it. Ask an organisation
            administrator if you need to.
          </p>
        </StateNotice>
      ) : (
        <div className="flex flex-col gap-4">
          <FilterBar
            accessibleLabel="Filter emergency access"
            identifier="access-review-filters"
            filters={[
              {
                key: "scope",
                label: "Show",
                options: REVIEW_FILTER_OPTIONS,
                allOptionsLabel: "Waiting for review",
                value: scope,
                onValueChange: setScope,
              },
            ]}
          />
          <DataTable
            accessibleLabel="Emergency access"
            columns={columns}
            state={
              grantsQuery.isPending
                ? { status: "loading", label: "Loading emergency access" }
                : grantsQuery.isError
                  ? {
                      status: "error",
                      title: "We could not load emergency access",
                      description: grantsQuery.error.message,
                      retryLabel: "Try again",
                      onRetry: () => void grantsQuery.refetch(),
                    }
                  : { status: "ready", rows: grantsQuery.data }
            }
            getRowIdentifier={(grant) => grant.id}
            rowAction={{
              label: (grant) => `Open the access to ${describePatient(grant)}`,
              onSelect: (grant) => setOpenGrantIdentifier(grant.id),
            }}
            emptyState={{
              illustration: <EmptyReviewQueueIllustration />,
              title: onlyUnreviewed
                ? "Nothing waiting for review"
                : "No emergency access yet",
            }}
          />
        </div>
      )}
      <DetailSheet
        open={openGrant !== null}
        onOpenChange={(open) => !open && setOpenGrantIdentifier(null)}
        title={openGrant ? describePatient(openGrant) : ""}
        titleAccessory={
          openGrant && <StatusLabel {...describeReviewState(openGrant)} />
        }
        description={openGrant?.patient.patientNumber}
      >
        {openGrant && (
          <div className="flex flex-col gap-8">
            <DetailList
              items={[
                {
                  term: "Opened by",
                  description: describeStaff(openGrant.userId),
                },
                { term: "Reason given", description: openGrant.reason },
                {
                  term: "Opened",
                  description: describeBranchDateTime(openGrant.grantedAt),
                },
                {
                  term: "Access ended",
                  description: describeBranchDateTime(openGrant.expiresAt),
                },
                ...(openGrant.review
                  ? [
                      {
                        term: "Reviewed by",
                        description: `${describeStaff(openGrant.review.reviewedById)}, ${describeBranchDateTime(openGrant.review.reviewedAt)}`,
                      },
                      {
                        term: "Review note",
                        description: openGrant.review.note,
                      },
                    ]
                  : []),
              ]}
            />
            <Link
              href={HEALTH_SCHEDULE_ROUTES.patient(openGrant.patientId)}
              className="w-fit text-sm font-medium text-primary underline underline-offset-4"
            >
              Open the patient’s record
            </Link>
            {!openGrant.review && (
              <ReviewForm
                grant={openGrant}
                onReviewed={() => setOpenGrantIdentifier(null)}
              />
            )}
          </div>
        )}
      </DetailSheet>
    </div>
  );
}
