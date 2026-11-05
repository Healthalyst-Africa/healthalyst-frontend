"use client";

import { useState, type FormEvent } from "react";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ActivityHistory } from "@healthalyst/ui/components/activity-history";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { ORGANIZATION_LIFECYCLE_LIMITS } from "~/features/organization-oversight/config/organization-lifecycle";
import { useOrganizationInternalNoteMutation } from "~/features/organization-oversight/hooks/use-organization-oversight";
import { internalNoteSchema } from "~/features/organization-oversight/schemas/organization-lifecycle-schemas";
import type { OrganizationDetail } from "~/features/organization-oversight/types/organization-types";
import { describeOrganizationHistory } from "~/features/organization-oversight/utilities/describe-organization-history";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

/** Adds a note that only HealthAlyst staff can see. */
export function InternalNoteForm({
  organizationId,
  staffIdentity,
}: {
  organizationId: string;
  staffIdentity: StaffIdentity;
}) {
  const noteMutation = useOrganizationInternalNoteMutation(staffIdentity);
  const [noteError, setNoteError] = useState("");

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const formElement = formEvent.currentTarget;
    const result = internalNoteSchema.safeParse({
      note: new FormData(formElement).get("note"),
    });
    if (!result.success) {
      setNoteError(result.error.issues[0]?.message ?? "Write the note.");
      formElement.querySelector<HTMLElement>('[name="note"]')?.focus();
      return;
    }
    setNoteError("");
    noteMutation.mutate(
      { organizationId, note: result.data.note },
      { onSuccess: () => formElement.reset() }
    );
  }

  function clearFeedback() {
    setNoteError("");
    if (noteMutation.isError || noteMutation.isSuccess) noteMutation.reset();
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <TextAreaField
        id="internal-note"
        label="Add an internal note"
        description="Only HealthAlyst staff can see internal notes."
        name="note"
        rows={3}
        maxLength={ORGANIZATION_LIFECYCLE_LIMITS.noteMaximumLength}
        disabled={noteMutation.isPending}
        error={noteError}
        onChange={clearFeedback}
      />
      {noteMutation.isError && (
        <NoticeBanner tone="error" title="The note was not saved">
          {noteMutation.error.message}
        </NoticeBanner>
      )}
      {noteMutation.isSuccess && (
        <NoticeBanner tone="success" title="Note saved" />
      )}
      <ActionButton
        className="self-start"
        type="submit"
        variant="outline"
        isLoading={noteMutation.isPending}
        loadingText="Saving note"
      >
        Save note
      </ActionButton>
    </form>
  );
}

/** Status changes and internal notes, newest first, with any reasons. */
export function OrganizationHistory({
  history,
}: {
  history: OrganizationDetail["history"];
}) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing has been recorded yet.
      </p>
    );
  }

  const entries = describeOrganizationHistory(history);

  return <ActivityHistory accessibleLabel="Status history" entries={entries} />;
}
