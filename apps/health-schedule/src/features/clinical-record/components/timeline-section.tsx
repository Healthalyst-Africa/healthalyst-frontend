"use client";

import { ActionButton } from "@healthalyst/ui/components/action-button";
import { EmptyState } from "@healthalyst/ui/components/empty-state";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import {
  NoticeBanner,
  StateNotice,
} from "@healthalyst/ui/components/notice-banner";
import { EmptyReviewQueueIllustration } from "@healthalyst/ui/illustrations/empty-review-queue-illustration";
import { TIMELINE_KIND_LABELS } from "~/features/clinical-record/config/clinical-record";
import { useTimeline } from "~/features/clinical-record/hooks/use-clinical-record";
import type { TimelineEntry } from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import {
  describeBranchClockTime,
  describeBranchDate,
} from "~/shared/time/branch-time";

/** Entries grouped by their branch date, keeping the newest-first order. */
function groupByDate(entries: readonly TimelineEntry[]) {
  const groups: { date: string; entries: TimelineEntry[] }[] = [];
  for (const entry of entries) {
    const date = describeBranchDate(entry.at);
    const lastGroup = groups.at(-1);
    if (lastGroup?.date === date) lastGroup.entries.push(entry);
    else groups.push({ date, entries: [entry] });
  }
  return groups;
}

/** Visits, triage, notes and documents in one list, newest first. */
export function TimelineSection({ patientId }: { patientId: string }) {
  const timelineQuery = useTimeline(patientId, true);
  const entries = timelineQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const isRestricted = timelineQuery.data?.pages[0]?.restricted ?? false;

  if (timelineQuery.isPending) {
    return (
      <LoadingPlaceholder
        label="Loading the timeline"
        rows={[{ shape: "card" }, { shape: "card" }]}
      />
    );
  }
  if (timelineQuery.isError) {
    return (
      <StateNotice
        tone="error"
        title="We could not load the timeline"
        action={
          <ActionButton
            type="button"
            variant="outline"
            onClick={() => void timelineQuery.refetch()}
          >
            Try again
          </ActionButton>
        }
      >
        <p>{timelineQuery.error.message}</p>
      </StateNotice>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {isRestricted && (
        <NoticeBanner tone="warning" title="Some entries are hidden">
          This record is restricted, so triage, notes and clinical documents are
          left out.
        </NoticeBanner>
      )}
      {entries.length === 0 ? (
        <EmptyState
          surface="panel"
          illustration={<EmptyReviewQueueIllustration />}
          title="Nothing recorded yet"
          description="Visits, triage, notes and documents appear here as they happen."
        />
      ) : (
        groupByDate(entries).map((group) => (
          <section key={group.date} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{group.date}</h3>
            <ol className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {group.entries.map((entry) => (
                <li
                  key={`${entry.kind}-${entry.id}`}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[6rem_7rem_1fr] sm:gap-4"
                >
                  <span className="text-sm text-muted-foreground">
                    {describeBranchClockTime(entry.at)}
                  </span>
                  <span className="text-sm font-medium">
                    {TIMELINE_KIND_LABELS[entry.kind]}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm">{entry.title}</span>
                    {(entry.detail || entry.status) && (
                      <span className="text-xs text-muted-foreground">
                        {[entry.detail, entry.status]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
      {timelineQuery.hasNextPage && (
        <ActionButton
          type="button"
          variant="outline"
          className="self-center"
          isLoading={timelineQuery.isFetchingNextPage}
          loadingText="Loading"
          onClick={() => void timelineQuery.fetchNextPage()}
        >
          Show earlier entries
        </ActionButton>
      )}
    </div>
  );
}
