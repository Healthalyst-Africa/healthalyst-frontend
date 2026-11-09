"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PauseIcon, PlayIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { StatusLabel } from "@healthalyst/ui/components/status-label";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  WeeklyHoursEditor,
  type WeeklyHoursDay,
} from "@healthalyst/ui/components/weekly-hours-editor";
import {
  NEW_WORKING_PERIOD,
  SCHEDULE_FIELD_LIMITS,
} from "~/features/schedule-setup/config/schedule-setup";
import {
  useReplaceCalendarHours,
  useUpdateScheduleCalendar,
} from "~/features/schedule-setup/hooks/use-schedule-setup";
import {
  renameCalendarFormSchema,
  type RenameCalendarFormValues,
} from "~/features/schedule-setup/schemas/schedule-form-schemas";
import type { ScheduleCalendar } from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { applyFieldErrors } from "~/features/schedule-setup/utilities/apply-field-errors";
import {
  describeCalendarKind,
  describeCalendarPlace,
  resolveHoursBranch,
} from "~/features/schedule-setup/utilities/describe-calendar";
import {
  findWorkingPeriodProblems,
  summarizeWeeklyHours,
  toAvailabilityRules,
  toWeeklyHoursDays,
  type WorkingPeriodDateLimits,
} from "~/features/schedule-setup/utilities/weekly-hours";

function createPeriodKey() {
  return globalThis.crypto.randomUUID();
}

/** One branch's weekly hours for a calendar, edited and saved together. */
function WeeklyHoursSection({
  calendar,
  branchIdentifier,
  branchName,
  canManage,
}: {
  calendar: ScheduleCalendar;
  branchIdentifier: string;
  branchName: string;
  canManage: boolean;
}) {
  const hoursMutation = useReplaceCalendarHours();
  const savedHours = useMemo(
    () =>
      toWeeklyHoursDays(
        calendar.availability,
        branchIdentifier,
        createPeriodKey
      ),
    [calendar.availability, branchIdentifier]
  );
  const [days, setDays] = useState<WeeklyHoursDay[]>(savedHours.days);
  const [dateLimits, setDateLimits] = useState<WorkingPeriodDateLimits>(
    savedHours.dateLimits
  );
  const [showProblems, setShowProblems] = useState(false);

  // A saved change or another branch starts the editor again.
  useEffect(() => {
    setDays(savedHours.days);
    setDateLimits(savedHours.dateLimits);
    setShowProblems(false);
  }, [savedHours]);

  const problems = findWorkingPeriodProblems(days);
  const periodCount = days.reduce(
    (count, day) => count + day.periods.length,
    0
  );
  const hasDateLimits = Object.keys(dateLimits).length > 0;

  if (!canManage) {
    return (
      <p className="text-sm">
        {summarizeWeeklyHours(calendar.availability, branchIdentifier)}
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        setShowProblems(true);
        if (Object.keys(problems).length > 0) return;
        hoursMutation.mutate(
          {
            calendarId: calendar.id,
            rules: toAvailabilityRules(
              days,
              branchIdentifier,
              calendar.availability,
              dateLimits
            ),
          },
          {
            onSuccess: () =>
              announceSuccess(`Hours saved for ${calendar.name}`),
          }
        );
      }}
    >
      {hasDateLimits && (
        <NoticeBanner tone="information" title="Some hours have dates">
          Some periods apply only between set dates. Saving keeps those dates.
        </NoticeBanner>
      )}
      <WeeklyHoursEditor
        id={`weekly-hours-${calendar.id}`}
        legend={`Weekly hours at ${branchName}`}
        hideLegend
        days={days}
        onDaysChange={setDays}
        newPeriod={NEW_WORKING_PERIOD}
        periodErrors={showProblems ? problems : {}}
        error={
          periodCount > SCHEDULE_FIELD_LIMITS.workingPeriodsMaximum
            ? `Use ${SCHEDULE_FIELD_LIMITS.workingPeriodsMaximum} periods or fewer.`
            : undefined
        }
        disabled={hoursMutation.isPending}
      />
      {hoursMutation.isError && (
        <NoticeBanner tone="error" title="The hours were not saved">
          {hoursMutation.error.message}
        </NoticeBanner>
      )}
      <ActionButton
        type="submit"
        className="self-start"
        isLoading={hoursMutation.isPending}
        loadingText="Saving hours"
      >
        Save hours
      </ActionButton>
    </form>
  );
}

function RenameSection({ calendar }: { calendar: ScheduleCalendar }) {
  const updateMutation = useUpdateScheduleCalendar();
  const form = useForm<RenameCalendarFormValues>({
    resolver: zodResolver(renameCalendarFormSchema),
    defaultValues: { name: calendar.name },
  });

  useEffect(() => {
    form.reset({ name: calendar.name });
    // Only a different saved name restarts the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar.name]);

  const submit = form.handleSubmit(({ name }) => {
    updateMutation.mutate(
      { calendarId: calendar.id, changes: { name } },
      {
        onSuccess: () => announceSuccess("Calendar renamed"),
        onError: (error) => applyFieldErrors(error, form.setError, ["name"]),
      }
    );
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextField
        id={`calendar-name-${calendar.id}`}
        label="Name"
        className="flex-1"
        error={
          form.formState.errors.name?.message ??
          (updateMutation.isError && !form.formState.errors.name
            ? updateMutation.error.message
            : undefined)
        }
        {...form.register("name")}
      />
      <ActionButton
        type="submit"
        variant="outline"
        className="sm:mt-7"
        isLoading={updateMutation.isPending}
        loadingText="Saving name"
      >
        Save name
      </ActionButton>
    </form>
  );
}

/** A calendar's details: its weekly hours, name and whether it can be booked. */
export function CalendarSheet({
  calendar,
  onOpenChange,
  branchNames,
  selectedBranch,
  canManage,
}: {
  calendar: ScheduleCalendar | null;
  onOpenChange: (open: boolean) => void;
  branchNames: ReadonlyMap<string, string>;
  /** The branch the person is working at, if they have chosen one. */
  selectedBranch: { id: string; name: string } | null;
  canManage: boolean;
}) {
  const statusMutation = useUpdateScheduleCalendar();
  const hoursBranchIdentifier = calendar
    ? resolveHoursBranch(calendar, selectedBranch?.id ?? null)
    : null;
  const otherBranchIdentifiers = calendar
    ? [
        ...new Set(
          calendar.availability
            .map((rule) => rule.branchId)
            .filter((branchId) => branchId !== hoursBranchIdentifier)
        ),
      ]
    : [];

  return (
    <DetailSheet
      open={calendar !== null}
      onOpenChange={(open) => {
        if (!open) statusMutation.reset();
        onOpenChange(open);
      }}
      title={calendar?.name ?? ""}
      titleAccessory={
        calendar && (
          <StatusLabel tone={calendar.isActive ? "positive" : "neutral"}>
            {calendar.isActive ? "Taking bookings" : "Paused"}
          </StatusLabel>
        )
      }
      description={
        calendar
          ? `${describeCalendarKind(calendar)} · ${describeCalendarPlace(calendar, branchNames)}`
          : undefined
      }
      footer={
        calendar &&
        canManage && (
          <ActionButton
            type="button"
            variant="outline"
            leadingIcon={
              calendar.isActive ? (
                <PauseIcon className="size-4" />
              ) : (
                <PlayIcon className="size-4" />
              )
            }
            isLoading={statusMutation.isPending}
            loadingText={calendar.isActive ? "Pausing" : "Resuming"}
            onClick={() =>
              statusMutation.mutate(
                {
                  calendarId: calendar.id,
                  changes: { isActive: !calendar.isActive },
                },
                {
                  onSuccess: (savedCalendar) =>
                    announceSuccess(
                      savedCalendar.isActive
                        ? `${savedCalendar.name} is taking bookings`
                        : `${savedCalendar.name} is paused`
                    ),
                }
              )
            }
          >
            {calendar.isActive ? "Pause bookings" : "Resume bookings"}
          </ActionButton>
        )
      }
    >
      {calendar && (
        <div className="flex flex-col gap-8">
          {statusMutation.isError && (
            <NoticeBanner tone="error" title="The calendar was not changed">
              {statusMutation.error.message}
            </NoticeBanner>
          )}
          {!calendar.isActive && (
            <NoticeBanner tone="information" title="This calendar is paused">
              It keeps its hours, but nobody can book it until bookings resume.
            </NoticeBanner>
          )}
          <section className="flex flex-col gap-3">
            <SectionHeading
              heading={
                hoursBranchIdentifier
                  ? `Weekly hours at ${branchNames.get(hoursBranchIdentifier) ?? "this branch"}`
                  : "Weekly hours"
              }
            />
            {hoursBranchIdentifier ? (
              <WeeklyHoursSection
                key={hoursBranchIdentifier}
                calendar={calendar}
                branchIdentifier={hoursBranchIdentifier}
                branchName={
                  branchNames.get(hoursBranchIdentifier) ?? "this branch"
                }
                canManage={canManage}
              />
            ) : (
              <NoticeBanner tone="information" title="Choose a branch first">
                A practitioner can work at several branches. Choose the branch
                at the top of the page to see and change their hours there.
              </NoticeBanner>
            )}
            {otherBranchIdentifiers.length > 0 && (
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-medium">Hours at other branches</p>
                <ul className="flex flex-col gap-1 text-muted-foreground">
                  {otherBranchIdentifiers.map((branchId) => (
                    <li key={branchId}>
                      {branchNames.get(branchId) ?? "Another branch"}:{" "}
                      {summarizeWeeklyHours(calendar.availability, branchId)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
          {canManage && (
            <section className="flex flex-col gap-3">
              <SectionHeading heading="Name" />
              <RenameSection calendar={calendar} />
            </section>
          )}
        </div>
      )}
    </DetailSheet>
  );
}
