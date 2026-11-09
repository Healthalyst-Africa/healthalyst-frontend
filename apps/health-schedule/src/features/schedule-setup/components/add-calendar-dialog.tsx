"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { CALENDAR_KIND_OPTIONS } from "~/features/schedule-setup/config/schedule-setup";
import {
  useCreateScheduleCalendar,
  usePractitionerCandidates,
} from "~/features/schedule-setup/hooks/use-schedule-setup";
import {
  createCalendarFormSchema,
  type CreateCalendarFormValues,
} from "~/features/schedule-setup/schemas/schedule-form-schemas";
import type { ScheduleCalendar } from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { applyFieldErrors } from "~/features/schedule-setup/utilities/apply-field-errors";
import { focusFirstInvalidField } from "~/features/schedule-setup/utilities/focus-first-invalid-field";
import { toCreateCalendarRequest } from "~/features/schedule-setup/utilities/schedule-requests";

type BranchOption = { value: string; label: string };

/** Gives a practitioner, room or piece of equipment a calendar. */
export function AddCalendarDialog({
  open,
  onOpenChange,
  existingCalendars,
  branchOptions,
  defaultBranchIdentifier,
  canChoosePractitioners,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCalendars: readonly ScheduleCalendar[];
  branchOptions: readonly BranchOption[];
  defaultBranchIdentifier: string;
  canChoosePractitioners: boolean;
  onAdded: (calendar: ScheduleCalendar) => void;
}) {
  const createMutation = useCreateScheduleCalendar();
  const defaultValues: CreateCalendarFormValues = {
    kind: canChoosePractitioners ? "PRACTITIONER" : "ROOM",
    memberId: "",
    branchId: defaultBranchIdentifier,
    name: "",
  };
  const form = useForm<CreateCalendarFormValues>({
    resolver: zodResolver(createCalendarFormSchema),
    defaultValues,
    shouldFocusError: false,
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const candidatesQuery = usePractitionerCandidates(
    open && canChoosePractitioners && kind === "PRACTITIONER"
  );

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      createMutation.reset();
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const memberIdentifiersWithCalendars = new Set(
    existingCalendars
      .map((calendar) => calendar.memberId)
      .filter((memberId): memberId is string => memberId !== null)
  );
  const practitionerOptions = (candidatesQuery.data?.members ?? [])
    .filter(
      (member) => !memberIdentifiersWithCalendars.has(member.membershipId)
    )
    .map((member) => ({
      value: member.membershipId,
      label: `${member.firstName} ${member.lastName}${member.jobTitle ? `, ${member.jobTitle}` : ""}`,
    }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label)
    );
  const kindOptions = CALENDAR_KIND_OPTIONS.filter(
    (option) => canChoosePractitioners || option.value !== "PRACTITIONER"
  );
  const errors = form.formState.errors;

  const submit = form.handleSubmit(
    (values) => {
      createMutation.mutate(toCreateCalendarRequest(values), {
        onSuccess: (calendar) => {
          announceSuccess(`${calendar.name} has a calendar`);
          onOpenChange(false);
          onAdded(calendar);
        },
        onError: (error) => {
          applyFieldErrors(error, form.setError, [
            "name",
            "memberId",
            "branchId",
          ]);
        },
      });
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        kind: "calendar-kind",
        memberId: "calendar-member",
        name: "calendar-name",
        branchId: "calendar-branch",
      })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a calendar"
      description="Doctors, house officers and midwives get a calendar when they join. Add one for anyone else who sees patients, and for rooms and equipment that are booked."
      submitLabel="Add calendar"
      submittingLabel="Adding calendar"
      isSubmitting={createMutation.isPending}
      error={
        createMutation.isError && Object.keys(errors).length === 0
          ? createMutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="kind"
        render={({ field }) => (
          <SelectField
            id="calendar-kind"
            label="What is booked"
            placeholder="Choose what is booked"
            options={kindOptions}
            value={field.value}
            onValueChange={(value) =>
              field.onChange(value as CreateCalendarFormValues["kind"])
            }
            error={errors.kind?.message}
          />
        )}
      />
      {kind === "PRACTITIONER" ? (
        <>
          {candidatesQuery.isError && (
            <NoticeBanner tone="error" title="We could not load your staff">
              {candidatesQuery.error.message}
            </NoticeBanner>
          )}
          <Controller
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <SelectField
                id="calendar-member"
                label="Staff member"
                placeholder={
                  candidatesQuery.isPending
                    ? "Loading staff…"
                    : practitionerOptions.length === 0
                      ? "Everyone already has a calendar"
                      : "Choose a staff member"
                }
                options={practitionerOptions}
                value={field.value}
                onValueChange={field.onChange}
                disabled={candidatesQuery.isPending}
                error={errors.memberId?.message}
              />
            )}
          />
          {candidatesQuery.data?.hasMore && (
            <NoticeBanner
              tone="information"
              title="Only the first 100 active staff are listed"
            />
          )}
        </>
      ) : (
        <>
          <TextField
            id="calendar-name"
            label="Name"
            placeholder={
              kind === "ROOM" ? "Consulting room 2" : "Ultrasound machine"
            }
            error={errors.name?.message}
            {...form.register("name")}
          />
          <Controller
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <SelectField
                id="calendar-branch"
                label="Branch"
                placeholder="Choose a branch"
                options={branchOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.branchId?.message}
              />
            )}
          />
        </>
      )}
    </FormDialog>
  );
}
